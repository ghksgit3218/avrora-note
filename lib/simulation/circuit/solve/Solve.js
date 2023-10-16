const Resistor = require('../component/Resistor');
const Voltage = require('../component/Voltage');
const BaseComponent = require('../component/BaseComponent');
const CircuitMatrix = require('../math/CircuitMatrix');
const SymbolicCircuitMatrix = require('../math/SymbolicCircuitMatrix');
const Wire = require('../component/Wire');
const BinarySwitch = require('../component/BinarySwitch');
const Circuit = require('../solve/Circuit');
const SymbolicCircuit = require('../solve/SymbolicCircuit');
const nerdamer = require('nerdamer')

// const voltage = new Voltage('V', 12)
// const resistor1 = new Resistor('R1', 1)
// // Component name, property(resistance), node(Node(i), Node(i + 1))
// const resistor2 = new Resistor('R2', 1)
// const resistor3 = new Resistor('R3', 2)
// const resistor4 = new Resistor('R4', 2)
// const resistor5 = new Resistor('R5', 2)

// const nodeRule = [
//     [1, 3, 5], // Node(1) == Node(3) == Node(5)
//     [4, 6, 7, 8, 9, 11],
//     [2, 10, 12]
// ]

// const circuit = new CircuitMatrix(
//     resistor1, resistor2, resistor3, resistor4, resistor5,
//     voltage
// )
// .applyRule(nodeRule)
// .solve();

// const currents = circuit.getCurrents()

// // {
// //     'V': 45 / 13,
// //     'R1': ...
// // }

// const voltage = new Voltage('V', 9);
// const resistor1 = new Resistor('R1', 1);
// const resistor2 = new Resistor('R2', 1);
// const resistor3 = new Resistor('R3', 1);
// const resistor4 = new Resistor('R4', 1);
// const resistor5 = new Resistor('R5', 1);
// const resistor6 = new Resistor('R6', 1);
// const resistor7 = new Resistor('R7', 1);
// const resistor8 = new Resistor('R8', 1);
// const wire1 = new Wire('W1');
// const wire2 = new Wire('W2');

// const nodeRule = [
//     [1, 4, 12, 13],
//     [3, 5],
//     [6, 7, 19],
//     [9, 20],
//     [8, 10, 11, 15],
//     [16, 21],
//     [22, 17],
//     // [16, 17],
//     [2, 14, 18]
// ]

// const circuitMatrix = new CircuitMatrix(
//     voltage, resistor1, resistor2, resistor3, resistor4, resistor5, resistor6, resistor7, resistor8, wire1, wire2
// )
// .applyRule(nodeRule);

// const voltage = new Voltage('V', 1);
// const resistor1 = new Resistor('R1', 1);
// const resistor2 = new Resistor('R2', 1);
// const wire = new Voltage('W', 0);

// const nodeRule = [
//     [1, 3],
//     [4, 7],
//     [8, 5],
//     [2, 6]
// ]

// const circuitMatrix = new CircuitMatrix(
//     voltage, resistor1, resistor2, wire
// ).applyRule(nodeRule)
// const circuit = new Circuit(circuitMatrix)
// .solve();

// console.log(circuit.currents);
// console.log(circuit.normalizedCurrents);

// console.log(circuit.normalizedVolts);
// console.log(circuit.normalizedCurrents);

// console.log((circuit.normalizedCurrents.R2 + circuit.normalizedCurrents.R8) * unknownResistance)

// const voltage = new Voltage('V', 'V');
// const resistor1 = new Resistor('R1', 'R');
// const resistor2 = new Resistor('R2', 'R');
// const resistor3 = new Resistor('R3', 'R');
// const resistor4 = new Resistor('R4', 'R');
// const resistor5 = new Resistor('R5', 'R');
// const resistor6 = new Resistor('R6', 'R');

// const nodeRule = [
//     [1, 4],
//     [3, 7, 10],
//     [9, 11],
//     [12, 13],
//     [14, 5, 8],
//     [2, 6]
// ];

// const circuitMatrix = new SymbolicCircuitMatrix(voltage, resistor1, resistor2, resistor3, resistor4, resistor5, resistor6).applyRule(nodeRule).solve();
// console.log(circuitMatrix.x)
// const circuit = new Circuit(circuitMatrix).solve();

// console.log(circuitMatrix.x)

// const voltage = new Voltage('V', 1);
// const resistor1 = new Resistor('R1', 1);
// const resistor2 = new Resistor('R2', 1);
// const resistor3 = new Resistor('R3', 1);
// const resistor4 = new Resistor('R4', 1);
// const resistor5 = new Resistor('R5', 1);
// const resistor6 = new Resistor('R6', 1);
// const wire1 = new Wire('W1');
// const wire2 = new Wire('W2');
// const wire3 = new Wire('W3');

// const nodeRule = [
//     [1, 3, 16],
//     [4, 5, 8],
//     [6, 20],
//     [9, 15],
//     [7, 18],
//     [10, 11, 17],
//     [12, 13],
//     [14, 19, 2]
// ];

// const circuitMatrix = new CircuitMatrix(
//     voltage,
//     resistor1, resistor2, resistor3, resistor4, resistor5, resistor6,
//     wire1, wire2, wire3
// ).applyRule(nodeRule);

// const circuit = new Circuit(circuitMatrix).solve();

// console.log(circuit.circuitMatrix.x)
// console.log(circuit.currents);
// console.log(circuit.normalizedCurrents);

const voltage = new Voltage('V', 1);
const resistor1 = new Resistor('R1', 1);
const resistor2 = new Resistor('R2', 1);
const binarySwitch = new BinarySwitch('S', true);

const nodeRule = [
    [1, 3, 7],
    [4, 5, 8],
    [2, 6]
]

const circuit = new Circuit(voltage, resistor1, resistor2, binarySwitch)
.applyRule(nodeRule)
.solve();

const equiv = circuit.getEquivCircuitString();
console.log(equiv)
// console.log(circuit.normalizedCurrents)
// console.log(circuit.normalizedVolts)