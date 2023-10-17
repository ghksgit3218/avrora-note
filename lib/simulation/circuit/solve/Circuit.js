const math = require('mathjs');
const Fraction = require('fraction.js');

const Voltage = require('../component/Voltage');
const Resistor = require('../component/Resistor');
const BinarySwitch = require('../component/BinarySwitch');
const Wire = require('../component/Wire');

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

            return this.nodes;
        } else {
            this.solved = false;
            throw new Error('No resistor! May cause error');
        }
    }
}

class Circuit {
    constructor(...components) {
        this.circuitMatrix = new CircuitMatrix(...components);

        this.components = this.circuitMatrix.components;

        this.nodes = {};
        this.connections = {};

        this.volts = {};
        this.currents = {};

        this.normalizedVolts = {};
        this.normalizedCurrents = {};

        this.connectivity = {};
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
            let binarySwitchConnectedToNode = rule
                .map(node => this.circuitMatrix.binarySwitchComponents.find(component => component.prevNode === node || component.nextNode === node))
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
                this.circuitMatrix.nodes[0] = rule;
            } else {
                i++;
                this.circuitMatrix.nodes[i] = rule;
            }
        }

        this.circuitMatrix.n = i;

        return this;
    }

    solve() {
        this.nodes = this.circuitMatrix.solve();

        if(!this.circuitMatrix.solved) return this;

        this.connections['0'] = {
            nodes: this.nodes['0'],
            electricPotential: 0,
            normalizedElectricPotential: 0,
        }

        const nodeKeys = Object.keys(this.nodes).filter(key => key > 0);
        for(const nodeKey of nodeKeys) {
            this.connections[nodeKey] = {
                nodes: this.nodes[nodeKey],
                electricPotential: this.circuitMatrix.x.subset(math.index(nodeKey - 1, 0)),
                normalizedElectricPotential: new Fraction(this.circuitMatrix.x.subset(math.index(nodeKey - 1, 0))).toFraction(false)
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
        // let wireCount = 0;
        // let nodeKeysConnectedToWire = [];
        for(const component of this.components) {
            if(component instanceof Voltage && !(component instanceof BinarySwitch && !component.isClosed) /* is also instance of wires */) {
                voltageCount++;
                this.volts[component.name] = component.voltage;
                this.currents[component.name] = this.circuitMatrix.x.subset(math.index(this.circuitMatrix.n + voltageCount - 1, 0));
            } else if(component instanceof Resistor) {
                const nodeKeyConnectedToPrevNode = findNodeKeyConnectedToNode(component.prevNode);
                const nodeKeyConnectedToNextNode = findNodeKeyConnectedToNode(component.nextNode);

                const prevElectricPotential = this.connections[nodeKeyConnectedToPrevNode]?.electricPotential;
                const nextElectricPotential = this.connections[nodeKeyConnectedToNextNode]?.electricPotential;

                const volt = prevElectricPotential - nextElectricPotential;
                this.volts[component.name] = volt;
                this.currents[component.name] = volt / component.resistance;
            }
            // else if (component instanceof Wire) {
            //     this.volts[component.name] = 0;
                
            //     wireCount++;
            //     this.currents[component.name] = `i${wireCount}`;

            //     nodeKeysConnectedToWire.push(findNodeKeyConnectedToNode(component.prevNode));
            // }
        }

        const componentNames = this.components.map(component => component.name);
        for(const componentName of componentNames) {
            const rationalVolt = new Fraction(this.volts[componentName]).toFraction(false);
            const rationalCurrent = new Fraction(this.currents[componentName]).toFraction(false);
            const maximumAppropriateLength = 6;

            this.normalizedVolts[componentName] = rationalVolt.length <= maximumAppropriateLength ?
                rationalVolt :
                    +(Math.round(this.volts[componentName] * 10000) / 10000).toFixed(3);
            this.normalizedCurrents[componentName] = rationalCurrent.length <= maximumAppropriateLength ?
                rationalCurrent :
                    isNaN(+this.currents[componentName]) ?
                        this.currents[componentName] :
                        +(Math.round(this.currents[componentName] * 10000) / 10000).toFixed(3);
        }

        // if(wireCount > 0) {
        //     nerdamer.set('SOLUTIONS_AS_OBJECT', false);
        //     // Apply KCL
        //     let equations = [];
        //     for(const nodeKey of nodeKeysConnectedToWire) {
        //         const nodes = this.nodes[nodeKey];
        //         const currents = nodes
        //             .map(node => this.components.find(component => component.prevNode === node || component.nextNode === node))
        //             .map(component => `(${this.currents[component.name]})`);
    
        //         equations.push(currents.reduce((a, c) => a + '+' + c) + '=0');
        //     }
    
        //     const solution = nerdamer.solveEquations(equations)
        //         .toString().split(',').filter((_, index) => index % 2 !== 0);
            
        //     // nerdamer.set('SOLUTIONS_AS_OBJECT', false);
        //     // Apply KCL
        //     let equations2 = [];
        //     for(const nodeKey of nodeKeysConnectedToWire) {
        //         const nodes = this.nodes[nodeKey];
        //         const currents = nodes
        //             .map(node => this.components.find(component => component.prevNode === node || component.nextNode === node))
        //             .map(component => `(${this.normalizedCurrents[component.name]})`);
    
        //         equations2.push(currents.reduce((a, c) => a + '+' + c) + '=0');
        //     }
    
        //     const solution2 = nerdamer.solveEquations(equations2)
        //         .toString().split(',').filter((_, index) => index % 2 !== 0);
            
        //     solution2.forEach((sol, index) => {
        //         const currentName =`i${index + 1}`;
        //         for(const componentName in this.normalizedCurrents) {
        //             if(this.normalizedCurrents[componentName] === currentName) {
        //                 this.normalizedCurrents[componentName] = Number(sol);
        //                 break;
        //             }
        //         }
        //     });
    
        //     solution.forEach((sol, index) => {
        //         const currentName =`i${index + 1}`;
        //         for(const componentName in this.currents) {
        //             if(this.currents[componentName] === currentName) {
        //                 this.currents[componentName] = isNaN(Number(sol)) ? sol : Number(sol);
        //                 break;
        //             }
        //         }
        //     });
        // }

        return this;
    }

    getEquivCircuitString() {
        // Parse components that its prevNode and nextNode are connected
        let nodes = Object.assign({}, this.nodes);
        let nodeKeys = Object.keys(nodes);
        let components = [...this.components];

        if(components.filter(component => (component instanceof Voltage && !(component instanceof Wire))).length !== 1) {
            throw new Error('To get equivalent circuit, should the voltage count be 1');
        }
        
        const findNodeKeyConnectedToNode = node => {
            for(const nodeKey of nodeKeys) {
                const connectedNodes = nodes[nodeKey];
                if(connectedNodes.includes(node)) return nodeKey;
            }

            return undefined;
        }

        const blankComponents = components.filter(component => (
            (!(component instanceof BinarySwitch) && component instanceof Wire) ||
            (component instanceof BinarySwitch && component.isClosed)
        ));

        for(const blankComponent of blankComponents) {
            const { prevNode, nextNode } = blankComponent;

            const prevNodeKey = findNodeKeyConnectedToNode(prevNode);
            const nextNodeKey = findNodeKeyConnectedToNode(nextNode);

            const lastKey = nodeKeys.sort((a, b) => b - a)[0];
            nodes[`${prevNodeKey !== '0' && nextNodeKey !== '0' ? +lastKey + 1 : '0'}`] = [...nodes[prevNodeKey], ...nodes[nextNodeKey]]
                .filter(node => node !== prevNode && node !== nextNode);

            if(prevNodeKey !== '0') delete nodes[prevNodeKey];
            if(nextNodeKey !== '0') delete nodes[nextNodeKey];

            nodeKeys = Object.keys(nodes);

            components = components.filter(component => component.prevNode !== prevNode);
        }

        for(const nodeKey of nodeKeys) {
            const currentNodeArr = nodes[nodeKey];
            const evenNodeArr = currentNodeArr.filter(node => node % 2 === 0);
            const shortCircuitPrevNodeArr = currentNodeArr.filter(node => node % 2 !== 0 && evenNodeArr.includes(node + 1));

            for(const shortCircuitPrevNode of shortCircuitPrevNodeArr) {
                const prevNodeIndex = currentNodeArr.findIndex(node => node === shortCircuitPrevNode);
                nodes[nodeKey].splice(prevNodeIndex, 1);

                const nextNodeIndex = currentNodeArr.findIndex(node => node === shortCircuitPrevNode + 1);
                nodes[nodeKey].splice(nextNodeIndex, 1);
            }

            // Delete component and nodeKey if open
            if(nodes[nodeKey].length === 1) {
                const node = nodes[nodeKey][0];
                const openComponent = components.find(component => component.prevNode === node || component.nextNode === node);
                components = components.filter(component => component.prevNode !== openComponent.prevNode);

                const prevNodeKey = findNodeKeyConnectedToNode(openComponent.prevNode);
                const nextNodeKey = findNodeKeyConnectedToNode(openComponent.nextNode);

                nodes[prevNodeKey] = nodes[prevNodeKey].filter(node => node !== openComponent.prevNode);
                nodes[nextNodeKey] = nodes[nextNodeKey].filter(node => node !== openComponent.nextNode);
            } 

            // Delete nodeKey if empty
            if(nodes[nodeKey].length === 0) {
                delete nodes[nodeKey];
            }
        }

        // Delete components that are not connected
        const totalNodes = Object.values(nodes).reduce((a, c) => [...a, ...c]);
        for(const component of components) {
            if(!totalNodes.includes(component.prevNode) && !totalNodes.includes(component.nextNode)) {
                components = components.filter(cp => cp.prevNode !== component.prevNode);
            }
        }

        const checkAllComponentsUsed = () => {
            const componentsUsed = Object.keys(this.connectivity);
            const allComponentNames = components.map(component => component.name)
                .filter(component => !(component instanceof BinarySwitch && !component.isClosed));
            const allComponentsUsed = allComponentNames.every(componentName => componentsUsed.includes(componentName));

            return allComponentsUsed;
        }
        

        const findComponentConnectedToNodeKey = (component, nodeKey) => {
            const prevNode = component.prevNode;
            const nextNode = component.nextNode;

            const currentNodeArr = nodes[nodeKey];

            return currentNodeArr.includes(prevNode) || currentNodeArr.includes(nextNode);
        }

        let tempResistorCount = 0;
        let changed = true;

        const getSeries = () => {
            for(const nodeKey of Object.keys(nodes)) {
                const currentNodeArr = nodes[nodeKey];
                if(currentNodeArr.length === 2) {
                    const [component1, component2] = components
                        .filter(component => !(component instanceof Voltage))
                        .filter(component => findComponentConnectedToNodeKey(component, nodeKey));

                    if(!component1 || !component2) continue;

                    const [componentName1, componentName2] = [component1, component2].map(component => component.name);

                    if(!this.connectivity[componentName1]) {
                        this.connectivity[componentName1] = {
                            component: component1,
                            series: [componentName2],
                            parallel: []
                        }
                    } else {
                        this.connectivity[componentName1].series
                            .push(
                                this.connectivity[componentName1].series.includes(componentName2) ?
                                    null : componentName2
                            );

                        this.connectivity[componentName1].series =
                            this.connectivity[componentName1].series.filter(x => !!x);
                    }

                    if(!this.connectivity[componentName2]) {
                        this.connectivity[componentName2] = {
                            component: component2,
                            series: [componentName1],
                            parallel: []
                        }
                    } else {
                        this.connectivity[componentName2].series
                            .push(
                                this.connectivity[componentName2].series.includes(componentName1) ?
                                    null : componentName1
                            );

                        this.connectivity[componentName2].series =
                            this.connectivity[componentName2].series.filter(x => !!x);
                    }

                    const component1PrevNodeKey = findNodeKeyConnectedToNode(component1.prevNode);
                    const component1NextNodeKey = findNodeKeyConnectedToNode(component1.nextNode);
                    const component2PrevNodeKey = findNodeKeyConnectedToNode(component2.prevNode);
                    const component2NextNodeKey = findNodeKeyConnectedToNode(component2.nextNode);

                    const commonNodeKey = [component1PrevNodeKey, component1NextNodeKey]
                        .find(nodeKey => component2PrevNodeKey === nodeKey || component2NextNodeKey === nodeKey);
                    if(component1 instanceof Resistor && component2 instanceof Resistor) {
                        const tempResistor = new Resistor(`tempResistor${++tempResistorCount}`, component1.resistance + component2.resistance);
                        tempResistor.temp = true;
                        tempResistor.compositeType = 'series';
                        tempResistor.connectedTo = [component1, component2];
                        const { prevNode, nextNode } = tempResistor;

                        const component12NodeKeys = [
                            component1PrevNodeKey, component1NextNodeKey,
                            component2PrevNodeKey, component2NextNodeKey
                        ];

                        const [compositeResistorPrevNodeKey, compositeResistorNextNodeKey] = [...new Set(component12NodeKeys)]
                            .filter(nodeKey => nodeKey !== commonNodeKey);

                        if(compositeResistorPrevNodeKey >= 0) {
                            nodes[compositeResistorPrevNodeKey] = nodes[compositeResistorPrevNodeKey]
                            .filter(node => ![component1.prevNode, component1.nextNode, component2.prevNode, component2.nextNode].includes(node));
                            nodes[compositeResistorPrevNodeKey].push(prevNode);
                        }

                        if(compositeResistorNextNodeKey >= 0) {
                            nodes[compositeResistorNextNodeKey] = nodes[compositeResistorNextNodeKey]
                            .filter(node => ![component1.prevNode, component1.nextNode, component2.prevNode, component2.nextNode].includes(node));
                            nodes[compositeResistorNextNodeKey].push(nextNode);
                        }

                        components.push(tempResistor);
                    }

                    delete nodes[commonNodeKey];
                    nodeKeys.splice(nodeKeys.findIndex(nodeKey => nodeKey === commonNodeKey), 1);
                    components = components.filter(component => component.prevNode !== component1.prevNode && component.prevNode !== component2.prevNode);

                    changed = true;
                }
            }
        }

        const getNodeKeyPair = (component) => {
            const { prevNode, nextNode } = component;

            const nodeKeyConnectedToPrevNode = findNodeKeyConnectedToNode(prevNode);
            const nodeKeyConnectedToNextNode = findNodeKeyConnectedToNode(nextNode);

            return {
                component,
                ...component,
                name: component.name,
                keyPair: [nodeKeyConnectedToPrevNode, nodeKeyConnectedToNextNode]
                    // Normalize
                    .sort((a, b) => a - b)
            }
        }

        const getParallel = () => {
            const nodeKeyPairs = components.map(getNodeKeyPair);

            outer: for(const nodeKey of nodeKeys) {
                const nodeKeyPairsIncludingNodeKey = [...new Set(nodeKeyPairs
                    .filter(keyPair => keyPair.keyPair.includes(nodeKey)))];

                for(const nodeKeyPair of nodeKeyPairsIncludingNodeKey) {
                    const parallelComponents = nodeKeyPairsIncludingNodeKey
                        .filter(keyPair => keyPair.keyPair[0] === nodeKeyPair.keyPair[0] && keyPair.keyPair[1] === nodeKeyPair.keyPair[1]);
                    const parallelComponentNames = parallelComponents
                        .map(keyPair => keyPair.name);

                    if(parallelComponentNames.length > 1) {
                        for(const componentName of parallelComponentNames) {
                            const otherNames = parallelComponentNames.filter(name => name !== componentName);

                            if(!this.connectivity[componentName]) {
                                this.connectivity[componentName] = {
                                    component: parallelComponents.find(component => component.component.name === componentName).component,
                                    series: [],
                                    parallel: otherNames
                                }
                            } else {
                                this.connectivity[componentName].parallel =
                                    [...new Set(this.connectivity[componentName].parallel.concat(otherNames))];

                                this.connectivity[componentName].parallel =
                                    this.connectivity[componentName].parallel.filter(x => !!x);
                            }
                        }

                        if(parallelComponents.every(component => component.component instanceof Resistor)) {
                            let prevNode, nextNode;

                            const compositeResistor = new Resistor(`tempResistor${++tempResistorCount}`, parallelComponents.reduce((a, c) => 1/a.resistance + 1/c.resistance));
                        
                            compositeResistor.temp = true;
                            compositeResistor.compositeType = 'parallel',
                            compositeResistor.connectedTo = [...parallelComponents.map(cp => cp.component)];

                            prevNode = compositeResistor.prevNode;
                            nextNode = compositeResistor.nextNode;

                            components.push(compositeResistor);

                            const prevNodeKey = parallelComponents[0].keyPair[0];
                            const nextNodeKey = parallelComponents[0].keyPair[1];

                            nodes[prevNodeKey] = nodes[prevNodeKey]
                                .filter(node => !parallelComponents
                                    .map(component => [component.prevNode, component.nextNode])
                                    .reduce((a, c) => [...a, ...c])
                                    .includes(node)
                                )
                            nodes[prevNodeKey].push(prevNode);
                                
                            nodes[nextNodeKey] = nodes[nextNodeKey]
                                .filter(node => !parallelComponents
                                    .map(component => [component.prevNode, component.nextNode])
                                    .reduce((a, c) => [...a, ...c])
                                    .includes(node)
                                )
                            nodes[nextNodeKey].push(nextNode);
                        }

                        components = components.filter(component => !(parallelComponents
                            .map(parallelComponent => parallelComponent.prevNode)
                            .includes(component.prevNode) &&
                            !(component instanceof Voltage))
                        );

                        changed = true;

                        break outer;
                    }
                }
            }
        }

        let isAllComponentUsed = false;
        let count = 0;
        while(changed) {
            changed = false;
            getSeries();
            getParallel();
            // console.log(++count, nodes)

            isAllComponentUsed = checkAllComponentsUsed();
            if(isAllComponentUsed) break;
        }

        const makeCircuitString = () => {

            const components = Object.keys(this.connectivity);
            const tempResistorNames = components.filter(componentName => /^tempResistor\d+$/g.test(componentName));

            const tempResistorDoc = {};
            let done = false;
            while(!done) {
                for(const tempResistorName of tempResistorNames) {
                    const { connectedTo, compositeType } = this.connectivity[tempResistorName].component;

                    if(!tempResistorDoc[tempResistorName]) {
                        console.log(tempResistorDoc, tempResistorName, connectedTo, compositeType);
                        if(compositeType === 'series') {
                            tempResistorDoc[tempResistorName] = `(${connectedTo.map(c => c.name).reduce((a, c) => a + '^' + c)})`;
                        } else if(compositeType === 'parallel') {
                            connectedTo.forEach(a => console.log(a.name))
                            tempResistorDoc[tempResistorName] = `(${connectedTo.map(c => c.name).reduce((a, c) => a + '||' + c)})`;
                        }
                    }

                    // Parse already connected temporary resistor(s)
                    const restTempResistorNames = Object.keys(tempResistorDoc)
                        .filter(name => name !== tempResistorName);
                    const re = new RegExp(`${tempResistorName}`, 'g');
                    for(const restTempResistorName of restTempResistorNames) {
                        if(re.test(tempResistorDoc[restTempResistorName])) {
                            tempResistorDoc[restTempResistorName] = tempResistorDoc[restTempResistorName].replace(tempResistorName, tempResistorDoc[tempResistorName]);
                        }
                    }
                }
                
                const re = /tempResistor/g
                if(Object.values(tempResistorDoc).every(composite => !re.test(composite))) done = true;
            }

            const originalComponentNames = components.filter(componentName => !/tempResistor/g.test(componentName));
            const connectivityDoc = {};
            for(const componentName of originalComponentNames) {
                if(!(this.connectivity[componentName] instanceof Voltage)) {
                    const { series, parallel } = this.connectivity[componentName];

                    if(series.length > 0) {
                        const currentCircuitString = [...new Set(series)]
                            .map((cpName, i, self) => {
                                if(/tempResistor/g.test(cpName)) {
                                    self = self.splice(i, 0, tempResistorDoc[cpName]);
                                    return tempResistorDoc[cpName];
                                } else {   
                                    return cpName;
                                }
                            })
                            .reduce((a, c) => a + '^' + c);
                        connectivityDoc[componentName] = `(${currentCircuitString})`;
                    } else if(parallel.length > 0) {
                        const currentCircuitString = [...new Set(parallel)]
                        .map((cpName, i, self) => {
                            if(/tempResistor/g.test(cpName)) {
                                self = self.splice(i, 0, tempResistorDoc[cpName]);
                                return tempResistorDoc[cpName];
                            } else {   
                                return cpName;
                            }
                        })
                        .reduce((a, c) => a + '||' + c);
                        connectivityDoc[componentName] = `(${currentCircuitString})`
                    }
                }
            }

            console.log(connectivityDoc)

            const voltageComponentName = Object.values(this.connectivity).find(cp => cp.component instanceof Voltage).component.name
            return `+${connectivityDoc[voltageComponentName]}-`;
        }

        return isAllComponentUsed ? makeCircuitString() : false;
    }
}

module.exports = Circuit;