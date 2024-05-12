'use strict';

const bleLegoHubServiceUUID =         '00001623-1212-efde-1623-785feabcd123';
const bleLegoHubCharacteristicUUID  = '00001624-1212-efde-1623-785feabcd123';
// const MTU = 20;

var bleRemoteDevice;
var legoService;
var legoCharacteristic;

var remoteConnected = false;
var bleBusy = false;

var handlers = {}


function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function toHex(d) {
    return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
}

function remoteConnectionToggle() {
    if (remoteConnected) {
        remoteDisconnect();
    } else {
        remoteConnect();
    }
}

// Sets button to either Connect or Disconnect
function changeRemoteConnectionState(state) {
    remoteConnected = state;
    let button = document.getElementById("remoteConnectButton")
    if (state) {
        button.innerHTML = "Disconnect";
        button.classList.add("connected");
        enableSleepLock();
    } else {
        button.innerHTML = "Connect";
        button.classList.remove("connected");
        disableSleepLock();
    }
}

function remoteConnect() {
    if (!checkBluetooth()) {
        terminal_writeln('WebBluetooth API is not available.\r\n' +
                    'Please make sure the Web Bluetooth flag is enabled.');
        return;
    }
    terminal_writeln('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice({
        filters: [{services: [bleLegoHubServiceUUID]}]
    })
    .then(device => {
        bleRemoteDevice = device; 
        terminal_writeln('Found ' + device.name);
        terminal_writeln('Connecting to GATT Server...');
        bleRemoteDevice.addEventListener('gattserverdisconnected', onRemoteDisconnected);
        return device.gatt.connect();
    })
    .then(server => {
        terminal_writeln('Locate Lego Hub service');
        return server.getPrimaryService(bleLegoHubServiceUUID);
    }).then(service => {
        legoService = service;
        terminal_writeln('Found Lego Hub service: ' + service.uuid);
    })
    .then(() => {
        terminal_writeln('Locate Lego Hub characteristic');
        return legoService.getCharacteristic(bleLegoHubCharacteristicUUID);
    })
    .then(characteristic => {
        legoCharacteristic = characteristic;
        terminal_writeln('Found Lego Hub characteristic');
        terminal_writeln('Enable notifications');
        return legoCharacteristic.startNotifications();
    })
    .then(() => {
        terminal_writeln('Notifications started');
        legoCharacteristic.addEventListener('characteristicvaluechanged',
                                            handleRemoteNotifications);
        changeRemoteConnectionState(true);
        terminal_writeln('\r\n' + bleRemoteDevice.name + ' Connected.');
    })
    .catch(error => {
        terminal_writeln('' + error);
        if(bleRemoteDevice && bleRemoteDevice.gatt.connected)
        {
            bleRemoteDevice.gatt.disconnect();
        }
    });
}

function remoteDisconnect() {
    if (!bleRemoteDevice) {
        terminal_writeln('No Bluetooth Device connected...');
        return;
    }
    terminal_writeln('Disconnecting from Bluetooth Device...');
    if (bleRemoteDevice.gatt.connected) {
        bleRemoteDevice.gatt.disconnect();
        changeRemoteConnectionState(false);
        terminal_writeln('Bluetooth Device connected: ' + bleRemoteDevice.gatt.connected);
    } else {
        terminal_writeln('> Bluetooth Device is already disconnected');
    }
}

function onRemoteDisconnected() {
    changeRemoteConnectionState(false);
    terminal_writeln('\r\n' + bleRemoteDevice.name + ' Disconnected.');
}

async function handleRemoteNotifications(event) {
    terminal_write('recvd:');
    let value = event.target.value;
    // Convert raw data bytes to character values and use these to 
    // construct a string.
    let str = "";
    let payload = []
    for (let i = 0; i < value.byteLength; i++) {
        str += ' ' + toHex(value.getUint8(i));
        payload.push(value.getUint8(i));
    }
    terminal_writeln(str);
    let messageType = payload[2];
    let eventName = "";
    switch (messageType) {
        case 0x04:
            if (payload[3] == 0x3C){
                await delay(100);
                activatePortDevice(0);
                await delay(100);
                activatePortDevice(1);
            }
            break;
        case 0x08:
            let decodeCenterEvent = {
                0x01: "oncenterpress",
                0x00: "oncenterrelease",
            }
            let centerEvent = payload[4]
            if (centerEvent in decodeCenterEvent) {
                eventName = decodeCenterEvent[centerEvent]
            }
            break;
        case 0x45:
            let decodePortEvent = {
                0x01: "pluspress",
                0x7F: "stoppress",
                0xFF: "minuspress",
                0x00: "release"
            }
            let decodePort = {
                0x00: "left",
                0x01: "right"
            }
            let port = payload[3]
            let portEvent = payload[4]
            if (port in decodePort) {
                if (portEvent in decodePortEvent) {
                    eventName = "on" + decodePort[port] + decodePortEvent[portEvent];
                }
            }
            break;
        default:
            console.log("Unhandled messageType", toHex(messageType));
    }
    if (eventName){
        terminal_writeln("Decoded event " + eventName);
        if (eventName in handlers) {
            handlers[eventName]();
        }
    }
    
}

function activatePortDevice(portNumber){
    remoteSendArray([0x41, portNumber, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01])
}

function remoteSendArray(arr, log=true) {
    if (bleRemoteDevice && bleRemoteDevice.gatt.connected) {
        if (log) {
            let str = "";
            for (let i = 0; i < arr.length; i++) {
                str += ' ' + toHex(arr[i]);
            }
            terminal_writeln("send: " + str);
        }
        let val_arr = new Uint8Array([arr.length, 0].concat(arr)); 
        remoteSendNextChunk(val_arr);
    } else {
        terminal_writeln('Not connected to a device yet.');
    }
}

function remoteSendNextChunk(a) {
    let chunk = a.slice(0, MTU);
    legoCharacteristic.writeValue(chunk)
        .then(function() {
            if (a.length > MTU) {
                bleBusy = true;
                remoteSendNextChunk(a.slice(MTU));
            } else {
                bleBusy = false;
            }
        });
}