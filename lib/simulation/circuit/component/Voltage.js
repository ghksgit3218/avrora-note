const BaseComponent = require('./BaseComponent');

class Voltage extends BaseComponent {
    constructor(name, voltage) {
        super(name);

        this.voltage = voltage;
    }
}

module.exports = Voltage;