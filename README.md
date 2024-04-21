# CircuitCubesRemote

CircuitCubeRemote is [browser application](https://github.com/repkovsky/CircuitCubeRemote) for remote control of [Circuit Cubes](https://circuitcubes.com) Bluetooth Battery Cube and two motors as steering and drive of a vehicle. Communication is implemented using Web Bluetooth API and Nordic UART. 

## Configuration

For steer and drive motors you can configure separately:
* speed (0-250)
    * for steering motor high speed makes it hard to control position precisely
    * lowering speed reduces torque
    * speeds below 80 may result in no motion at all
* rotation inversion (depending on how the motors and battery were connected, change of direction of rotation may be required)
* choice of channels (A, B, C) for driving motor and steering motor

With _Return to center_ enabled, after one of steering buttons is pressed and then released, the steering motor rotates with the same speed in the opposite direction for the configured time interval. If button is pressed shorter then return time will be similar to the pressing time. Due to inaccuracies in timing in JavaScript, Bluetooth transmission and in Bluetooth Battery Cube, actual times may differ by approx. ~20ms. Resulting inaccuracy of motor rotation angle increases with rotation speed.

## Protocol

Bluetooth Battery Cube recognizes commands sent by Nordic UART in format `dNNNc` where:
* `d` - direction of rotation: `+` or `-`
* `NNN` - speed of rotation with leading zeros in range 0-255. Values greater than 255 are not recognized.
* `c` - output channel in Bluetooth Battery Cube: `a`, `b`, `c`

Examples: `+123a`, `-009b`, `+000c` 


# Other implementations of Circuit Cubes Bluetooth communication 

* C: controlling CircuitCube with LEGO Remote using M5Atom as hub https://github.com/asperka/LEGORemoteCircuitCube
* Java: https://github.com/kvp-git/traindriver
* Python: 
    * https://github.com/blockninja124/Circuit-Cube-Python
    * https://github.com/dsobotta/mqtt-circuit-cubes