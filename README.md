# CircuitCubesRemote

CircuitCubesRemote is [browser application](https://repkovsky.github.io/CircuitCubesRemote) for remote control of [Circuit Cubes](https://circuitcubes.com) Bluetooth Battery Cube and two motors as steering and drive of a vehicle. Additionally, [LEGO 88010 Remote](https://www.lego.com/pl-pl/product/remote-control-88010) can be connected to the application and used as a physical controller. Bluetooth communication is implemented using Web Bluetooth API, with Nordic UART protocol for CircuitCubes and [LEGO Wireless Protocol](https://lego.github.io/lego-ble-wireless-protocol-docs) for LEGO Remote. 

## Configuration

For steer and drive motors you can configure separately:
* speed (0-255)
    * for steering motor high speed makes it hard to control position precisely
    * lowering speed reduces torque
    * speeds below 80 may result in no motion at all
* rotation inversion (depending on how the motors and battery were connected, change of direction of rotation may be required)
* choice of channels (A, B, C) for driving motor and steering motor

With _Return to center steering_ enabled, after one of steering buttons is pressed and then released, the steering motor rotates with the same speed in the opposite direction for the configured time interval. If button press time is shorter than configured time, then return time will be similar to the press time. Due to inaccuracies in timing in JavaScript, Bluetooth transmission and in Bluetooth Battery Cube, actual times may differ by approx. ~20ms. Resulting inaccuracy of motor rotation angle increases with rotation speed.

## Protocol

Bluetooth Battery Cube recognizes commands sent by Nordic UART in format `dNNNc` where:
* `d` - direction of rotation: `+` or `-`
* `NNN` - speed of rotation with leading zeros in range 0-255. Values greater than 255 are not recognized.
* `c` - output channel in Bluetooth Battery Cube: `a`, `b`, `c`

Examples: `+123a`, `-009b`, `+000c` 


## Other open-source Circuit Cubes resources

* C: controlling Circuit Cubes with LEGO Remote using M5Atom as hub https://github.com/asperka/LEGORemoteCircuitCube
* Java: Android train controller app https://github.com/kvp-git/traindriver
* Python: 
    * Beginner friendly code for controlling Circuit Cubes https://github.com/blockninja124/Circuit-Cube-Python
    * Train controller using MQTT protocol https://github.com/dsobotta/mqtt-circuit-cubes