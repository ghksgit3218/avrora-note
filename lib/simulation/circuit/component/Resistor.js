const BaseComponent = require('./BaseComponent');

class Resistor extends BaseComponent {
    constructor(name, resistance) {
        super(name);

        this.resistance = resistance;
    }
}

module.exports = Resistor;