class Node {
    static nodeCount = 0;

    constructor() {
        Node.nodeCount += 1;

        this.currentNodeCount = Node.nodeCount;

        this.prevNode = 2 * this.currentNodeCount - 1;
        this.nextNode = 2 * this.currentNodeCount;
    }
}

module.exports = Node;