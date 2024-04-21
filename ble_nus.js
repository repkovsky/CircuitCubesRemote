'use strict';

const bleNusServiceUUID  = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const bleNusCharRXUUID   = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const bleNusCharTXUUID   = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const MTU = 20;

var bleDevice;
var nusService;
var rxCharacteristic;
var txCharacteristic;

var connected = false;
var bleBusy = false;

function connectionToggle() {
    if (connected) {
        disconnect();
    } else {
        connect();
    }
}

// Sets button to either Connect or Disconnect
function changeConnectionState(state) {
    connected = state;
    if (state) {
        document.getElementById("clientConnectButton").innerHTML = "Disconnect";
    } else {
        document.getElementById("clientConnectButton").innerHTML = "Connect";
    }
}

function connect() {
    if (!navigator.bluetooth) {
        terminal_writeln('WebBluetooth API is not available.\r\n' +
                    'Please make sure the Web Bluetooth flag is enabled.');
        terminal_writeln('WebBluetooth API is not available on your browser.\r\n' +
                    'Please make sure the Web Bluetooth flag is enabled.');
        return;
    }
    terminal_writeln('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice({
        filters: [{services: [bleNusServiceUUID]}]
    })
    .then(device => {
        bleDevice = device; 
        terminal_writeln('Found ' + device.name);
        terminal_writeln('Connecting to GATT Server...');
        bleDevice.addEventListener('gattserverdisconnected', onDisconnected);
        return device.gatt.connect();
    })
    .then(server => {
        terminal_writeln('Locate NUS service');
        return server.getPrimaryService(bleNusServiceUUID);
    }).then(service => {
        nusService = service;
        terminal_writeln('Found NUS service: ' + service.uuid);
    })
    .then(() => {
        terminal_writeln('Locate RX characteristic');
        return nusService.getCharacteristic(bleNusCharRXUUID);
    })
    .then(characteristic => {
        rxCharacteristic = characteristic;
        terminal_writeln('Found RX characteristic');
    })
    .then(() => {
        terminal_writeln('Locate TX characteristic');
        return nusService.getCharacteristic(bleNusCharTXUUID);
    })
    .then(characteristic => {
        txCharacteristic = characteristic;
        terminal_writeln('Found TX characteristic');
    })
    .then(() => {
        terminal_writeln('Enable notifications');
        return txCharacteristic.startNotifications();
    })
    .then(() => {
        terminal_writeln('Notifications started');
        txCharacteristic.addEventListener('characteristicvaluechanged',
                                          handleNotifications);
        changeConnectionState(true);
        terminal_writeln('\r\n' + bleDevice.name + ' Connected.');
    })
    .catch(error => {
        terminal_writeln('' + error);
        if(bleDevice && bleDevice.gatt.connected)
        {
            bleDevice.gatt.disconnect();
        }
    });
}

function disconnect() {
    if (!bleDevice) {
        terminal_writeln('No Bluetooth Device connected...');
        return;
    }
    terminal_writeln('Disconnecting from Bluetooth Device...');
    if (bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
        changeConnectionState(false);
        terminal_writeln('Bluetooth Device connected: ' + bleDevice.gatt.connected);
    } else {
        terminal_writeln('> Bluetooth Device is already disconnected');
    }
}

function onDisconnected() {
    changeConnectionState(false);
    terminal_writeln('\r\n' + bleDevice.name + ' Disconnected.');
}

function handleNotifications(event) {
    terminal_write('notification');
    let value = event.target.value;
    // Convert raw data bytes to character values and use these to 
    // construct a string.
    let str = "";
    for (let i = 0; i < value.byteLength; i++) {
        str += String.fromCharCode(value.getUint8(i));
    }
    terminal_writeln(str);
}

function nusSendString(s, log=true) {
    if (bleDevice && bleDevice.gatt.connected) {
        if (log) terminal_writeln("send: " + s);
        let val_arr = new Uint8Array(s.length)
        for (let i = 0; i < s.length; i++) {
            let val = s[i].charCodeAt(0);
            val_arr[i] = val;
        }
        sendNextChunk(val_arr);
    } else {
        terminal_writeln('Not connected to a device yet.');
    }
}

function sendNextChunk(a) {
    let chunk = a.slice(0, MTU);
    rxCharacteristic.writeValue(chunk)
        .then(function() {
            if (a.length > MTU) {
                bleBusy = true;
                sendNextChunk(a.slice(MTU));
            } else {
                bleBusy = false;
            }
        });
}