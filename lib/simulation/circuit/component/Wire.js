const Voltage = require('../component/Voltage');

// Somehow, Wire works well when seeing it as 0 volt Voltage rather than 0 resistance Resistor
class Wire extends Voltage {
    constructor(name) {
        super(name, 0);
    }
}

module.exports = Wire;