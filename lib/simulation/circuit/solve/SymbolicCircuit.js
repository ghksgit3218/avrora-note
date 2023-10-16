const math = require('mathjs');
const nerdamer = require('nerdamer');
require('nerdamer/Solve');

const Voltage = require('../component/Voltage');
const Resistor = require('../component/Resistor');
const BinarySwitch = require('../component/BinarySwitch');
const Wire = require('../component/Wire');
const SymbolicCircuitMatrix = require('../math/SymbolicCircuitMatrix');

class SymbolicCircuit {
    constructor(circuitMatrix) {
        if(!(circuitMatrix instanceof SymbolicCircuitMatrix)) throw new Error('Constructor got wrong argument!');

        this.circuitMatrix = circuitMatrix;

        this.components = this.circuitMatrix.components;

        this.nodes = circuitMatrix.nodes;
        this.connections = {};

        this.volts = {};
        this.currents = {};

        this.normalizedVolts = {};
        this.normalizedCurrents = {};
    }

    solve() {
        this.circuitMatrix.solve();

        if(!this.circuitMatrix.solved) return this;

        this.connections['0'] = {
            nodes: this.nodes['0'],
            electricPotential: 0
        }

        const nodeKeys = Object.keys(this.nodes).filter(key => key > 0);
        for(const nodeKey of nodeKeys) {
            this.connections[nodeKey] = {
                nodes: this.nodes[nodeKey],
                electricPotential: this.circuitMatrix.x[nodeKey - 1][0]
            }
        }

        const findNodeKeyConnectedToNode = node => {
            const nodeKeys = Object.keys(this.nodes);

            for(const nodeKey of nodeKeys) {
                const connectedNodes = this.nodes[nodeKey];
                if(connectedNodes.includes(node)) return nodeKey;
            }

            return undefined;
        }

        let voltageCount = 0;
        nerdamer.set('SOLUTIONS_AS_OBJECT', true);
        for(const component of this.components) {
            if(component instanceof Voltage && !(component instanceof BinarySwitch && !component.isClosed) /* is also instance of wires */) {
                voltageCount++;
                this.volts[component.name] = component.voltage;
                this.currents[component.name] = this.circuitMatrix.x[this.circuitMatrix.n + voltageCount - 1][0];
            } else if(component instanceof Resistor) {
                const nodeKeyConnectedToPrevNode = findNodeKeyConnectedToNode(component.prevNode);
                const nodeKeyConnectedToNextNode = findNodeKeyConnectedToNode(component.nextNode);

                const prevElectricPotential = this.connections[nodeKeyConnectedToPrevNode].electricPotential;
                const nextElectricPotential = this.connections[nodeKeyConnectedToNextNode].electricPotential;

                nerdamer.setVar('volt', `${prevElectricPotential} - ${nextElectricPotential}`);
                const volt = nerdamer.getVars('text')['volt'];
                this.volts[component.name] = volt;
                nerdamer.setVar('current', `${volt} / ${component.resistance}`);
                this.currents[component.name] = nerdamer.getVars('text')['current'];
            }
        }

        const componentNames = this.components.map(component => component.name);
        for(const componentName of componentNames) {
            this.normalizedVolts[componentName] = this.volts[componentName]
            this.normalizedCurrents[componentName] = this.currents[componentName]
        }

        return this;
    }
}

module.exports = SymbolicCircuit;