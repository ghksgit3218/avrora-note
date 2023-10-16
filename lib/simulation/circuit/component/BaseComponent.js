const Node = require('./Node');

class BaseComponent {
    constructor(name) {
        this.name = name;

        this.node = new Node();

        this.prevNode = this.node.prevNode;
        this.nextNode = this.node.nextNode;
    }
}

module.exports = BaseComponent