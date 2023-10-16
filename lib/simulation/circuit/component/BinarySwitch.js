const Wire = require('../component/Wire');

class BinarySwitch extends Wire {
    constructor(name, isClosed = false) {
        super(name);

        this.isClosed = isClosed;
    }
}

module.exports = BinarySwitch;