'use strict';

const bleNusServiceUUID  = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const bleNusCharRXUUID   = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const bleNusCharTXUUID   = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const MTU = 20;

var bleDevice;
var bleServer;
var nusService;
var rxCharacteristic;
var txCharacteristic;

var connected = false;

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
        terminal_write('WebBluetooth API is not available.\r\n' +
                    'Please make sure the Web Bluetooth flag is enabled.');
        terminal_writeln('WebBluetooth API is not available on your browser.\r\n' +
                    'Please make sure the Web Bluetooth flag is enabled.');
        return;
    }
    terminal_write('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice({
        //filters: [{services: []}]
        optionalServices: [bleNusServiceUUID],
        acceptAllDevices: true
    })
    .then(device => {
        bleDevice = device; 
        terminal_write('Found ' + device.name);
        terminal_write('Connecting to GATT Server...');
        bleDevice.addEventListener('gattserverdisconnected', onDisconnected);
        return device.gatt.connect();
    })
    .then(server => {
        terminal_write('Locate NUS service');
        return server.getPrimaryService(bleNusServiceUUID);
    }).then(service => {
        nusService = service;
        terminal_write('Found NUS service: ' + service.uuid);
    })
    .then(() => {
        terminal_write('Locate RX characteristic');
        return nusService.getCharacteristic(bleNusCharRXUUID);
    })
    .then(characteristic => {
        rxCharacteristic = characteristic;
        terminal_write('Found RX characteristic');
    })
    .then(() => {
        terminal_write('Locate TX characteristic');
        return nusService.getCharacteristic(bleNusCharTXUUID);
    })
    .then(characteristic => {
        txCharacteristic = characteristic;
        terminal_write('Found TX characteristic');
    })
    .then(() => {
        terminal_write('Enable notifications');
        return txCharacteristic.startNotifications();
    })
    .then(() => {
        terminal_write('Notifications started');
        txCharacteristic.addEventListener('characteristicvaluechanged',
                                          handleNotifications);
        changeConnectionState(true);
        terminal_writeln('\r\n' + bleDevice.name + ' Connected.');
        nusSendString('+100a');
    })
    .catch(error => {
        terminal_write('' + error);
        terminal_writeln('' + error);
        if(bleDevice && bleDevice.gatt.connected)
        {
            bleDevice.gatt.disconnect();
        }
    });
}

function disconnect() {
    if (!bleDevice) {
        terminal_write('No Bluetooth Device connected...');
        return;
    }
    terminal_write('Disconnecting from Bluetooth Device...');
    if (bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
        changeConnectionState(false);
        terminal_write('Bluetooth Device connected: ' + bleDevice.gatt.connected);
    } else {
        terminal_write('> Bluetooth Device is already disconnected');
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
    terminal_write(str);
}

function nusSendString(s) {
    if(bleDevice && bleDevice.gatt.connected) {
        terminal_write("send: " + s);
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
              sendNextChunk(a.slice(MTU));
          }
      });
}