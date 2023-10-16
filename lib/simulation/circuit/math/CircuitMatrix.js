const math = require('mathjs');

const Resistor = require('../component/Resistor');
const Voltage = require('../component/Voltage');
const Wire = require('../component/Wire');
const BinarySwitch = require('../component/BinarySwitch');

class CircuitMatrix {
    constructor(...components) {
        this.components = components;
        this.nodes = {};
        this.solvable = this.components.length > 0 &&
            this.components.filter(component => component instanceof Resistor).length > 0;

        this.solved = false;

        this.resistorComponents = this.components
            .filter(component => component instanceof Resistor);
        this.voltageComponents = this.components
            .filter(component => component instanceof Voltage && !(component instanceof BinarySwitch && !component.isClosed))
        this.binarySwitchComponents = this.components
            .filter(component => component instanceof BinarySwitch);

        // Wires are already instances of Voltage (of 0 volt)
        // this.wireComponents = this.components
        //     .filter(component => component instanceof Wire);

        this.n = 0;
        this.m = this.voltageComponents?.length || 0;

        // base matrices
        this.A = null;
        this.x = null;
        this.z = null;

        // for A matrix
        this.G = null;
        this.B = null;
        this.C = null;
        this.D = null;

        // for x matrix
        this.v = null;
        this.j = null;

        // for z matrix;
        this.i = null;
        this.e = null;
    }

    applyRule(nodeRule) {
        if(!Array.isArray(nodeRule) && nodeRule.some(rule => !Array.isArray(rule))) {
            throw new Error('Invalid nodeRule: nodeRule and its elelments should all be arrays');
        }

        const hasVoltage = this.components
            .find(component => component instanceof Voltage && !(component instanceof Wire || component instanceof BinarySwitch));
        let groundNode = hasVoltage?.nextNode || -1;

        let i = 0;
        for(const rule of nodeRule) {
            // Apparently, the MNA algorithm does not account for wires connected parallel to resistors, so add below.
            // const prevNodes = rule.filter(node => node % 2 === 0);
            // const nextNodes = rule.filter(node => node % 2 !== 0);
            // const shortCircuitPrevNodes = prevNodes.filter(prevNode => nextNodes.includes(prevNode - 1));

            // for(const shortCircuitPrevNode of shortCircuitPrevNodes) {
            //     const prevNodeIndex = rule.findIndex(node => node === shortCircuitPrevNode);
            //     const nextNodeIndex = rule.findIndex(node => node === shortCircuitPrevNode);

            //     rule.splice(prevNodeIndex, 1);
            //     rule.splice(nextNodeIndex, 1);
            // }

            let binarySwitchConnectedToNode = rule
                .map(node => this.binarySwitchComponents.find(component => component.prevNode === node || component.nextNode === node))
                .filter(x => !!x);

            binarySwitchConnectedToNode = [...new Set(binarySwitchConnectedToNode)];

            for(const binarySwitch of binarySwitchConnectedToNode) {
                if(!binarySwitch.isClosed) {
                    const nodeIndexConnectedToSwitch = rule
                        .findIndex(node => binarySwitch.prevNode === node || binarySwitch.nextNode === node);
                    
                    rule.splice(nodeIndexConnectedToSwitch, 1);
                }
            }

            if(rule.includes(groundNode)) {
                this.nodes[0] = rule;
            } else {
                i++;
                this.nodes[i] = rule;
            }
        }

        this.n = i;

        return this;
    }

    #getG() {
        const GArr = Array(this.n).fill(0);

        // Do this for immutable object problem (copying)
        for(let i=0; i<this.n; i++) {
            GArr[i] = Array(this.n).fill(0);
        }

        const getConductance = resistance => resistance === 0 ? Infinity : 1 / resistance;

        const nodeKeys = Object.keys(this.nodes).filter(key => key > 0);
        for(const nodeKey of nodeKeys) {
            const connectedNodes = this.nodes[nodeKey];
            const connectedResistors = this.resistorComponents
                .filter(resistor => connectedNodes.includes(resistor.prevNode) || connectedNodes.includes(resistor.nextNode));

            const totalConductance = connectedResistors
                .map(resistor => getConductance(resistor.resistance))
                .reduce((a, c) => a + c, 0);

            GArr[nodeKey - 1][nodeKey - 1] = totalConductance;
        }

        const findNodeKeyConnectedToNode = node => {
            for(const nodeKey of nodeKeys) {
                const connectedNodes = this.nodes[nodeKey];
                if(connectedNodes.includes(node)) return nodeKey;
            }

            return undefined;
        }

        const nodesConnectedToGround = this.nodes[0];
        for(const resistor of this.resistorComponents) {
            if(nodesConnectedToGround.includes(resistor.prevNode) || nodesConnectedToGround.includes(resistor.nextNode)) {
                continue;
            }

            const nodeKeyConnectedToPrevNode = findNodeKeyConnectedToNode(resistor.prevNode);
            const nodeKeyConnectedToNextNode = findNodeKeyConnectedToNode(resistor.nextNode);

            if(!nodeKeyConnectedToPrevNode || !nodeKeyConnectedToNextNode) continue;

            GArr[nodeKeyConnectedToPrevNode - 1][nodeKeyConnectedToNextNode - 1] -= getConductance(resistor.resistance);
            GArr[nodeKeyConnectedToNextNode - 1][nodeKeyConnectedToPrevNode - 1] -= getConductance(resistor.resistance);
        }

        const G = math.matrix(GArr);

        this.G = G;
    }

    #getB() {
        const BArr = Array(this.n).fill(0);

        for(let i=0; i<this.n; i++) {
            BArr[i] = Array(this.m).fill(0);
        }

        const nodeKeys = Object.keys(this.nodes);
        const findNodeKeyConnectedToNode = node => {
            for(const nodeKey of nodeKeys) {
                const connectedNodes = this.nodes[nodeKey];
                if(connectedNodes.includes(node)) return nodeKey;
            }

            return undefined;
        }

        for(let i=0; i<this.voltageComponents.length; i++) {
            const voltage = this.voltageComponents[i];
            // prevNode of voltage is positive end
            // nextNode of voltage is negative end

            const nodeKeyConnectedToPrevNode = findNodeKeyConnectedToNode(voltage.prevNode);
            if(nodeKeyConnectedToPrevNode > 0) BArr[nodeKeyConnectedToPrevNode - 1][i] = 1;

            const nodeKeyConnectedToNextNode = findNodeKeyConnectedToNode(voltage.nextNode);
            if(nodeKeyConnectedToNextNode > 0) BArr[nodeKeyConnectedToNextNode - 1][i] = -1;
        }

        const B = math.matrix(BArr);

        this.B = B;
    }

    #getC() {
        this.#getB();
        const C = math.transpose(this.B);

        this.C = C;
    }

    #getD() {
        const DArr = Array(this.m).fill(Array(this.m).fill(0));

        const D = math.matrix(DArr);

        this.D = D;
    }

    #getA() {
        this.#getG();
        // this.#getB();
        this.#getC();
        this.#getD();

        const GB = math.concat(this.G, this.B);
        const CD = math.concat(this.C, this.D);

        const GBTransposed = math.transpose(GB);
        const CDTransposed = math.transpose(CD);
        const ATransposed = math.concat(GBTransposed, CDTransposed);

        const A = math.transpose(ATransposed);

        this.A = A;
    }

    #geti() {
        const iArr = Array(this.n).fill([0]);

        const i = math.matrix(iArr);

        this.i = i;
    }

    #gete() {
        const eArr = Array(this.m).fill([0]);

        for(let i=0; i<this.m; i++) {
            eArr[i] = [this.voltageComponents[i].voltage];
        }

        const e = math.matrix(eArr);

       this.e = e;
    }

    #getz() {
        this.#geti();
        this.#gete();

        const iTransposed = math.transpose(this.i);
        const eTransposed = math.transpose(this.e);

        const zTransposed = math.concat(iTransposed, eTransposed);

        const z = math.transpose(zTransposed);

        this.z = z;
    }

    #getx() {
        // x = A-1z
        this.#getA();
        this.#getz();
        // console.log(this.A)
        const inverseA = math.inv(this.A);

        const x = math.multiply(inverseA, this.z);

        this.x = x;
    }

    solve() {
        if(this.solvable) {
            this.#getx();
            this.solved = true;

            return this;
        } else {
            this.solved = false;
            throw new Error('No resistor! May cause error');
        }
    }
}

module.exports = CircuitMatrix;