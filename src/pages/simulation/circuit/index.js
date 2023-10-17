import styles from './index.module.scss';
import { useEffect, useState } from 'react';
import Button from '@mui/joy/Button';
import { ArrowBack } from '@mui/icons-material';
import VoltageButton from '@/components/VoltageButton';
import ResistorButton from '@/components/ResistorButton';
import WireButton from '@/components/WireButton';
import BinarySwitchButton from '@/components/BinarySwitchButton';
import ResistorDraggable from '@/components/ResistorDraggable';
import Resistor from '../../../../lib/simulation/circuit/component/Resistor';
import Wire from '../../../../lib/simulation/circuit/component/Wire';
import WireDraggable from '@/components/WireDraggable';
import VoltageDraggable from '@/components/VoltageDraggable';
import Voltage from '../../../../lib/simulation/circuit/component/Voltage';
import Node from '../../../../lib/simulation/circuit/component/Node';
import Circuit from '../../../../lib/simulation/circuit/solve/Circuit';
import { Delete } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { Modal, ModalClose, Sheet, Typography } from '@mui/joy';

const getInitialComponents = (componentURI) => {
    const initialComponents = [];
    try {
        const cpInfo = JSON.parse(decodeURIComponent(componentURI));
        for(const cp of cpInfo) {
            const { name } = cp;

            if(name[0] === 'V') {
                initialComponents.push(new Voltage(name, cp.voltage));
            } else if(name[0] === 'W') {
                initialComponents.push(new Wire(name));
            } else if(name[0] === 'R') {
                initialComponents.push(new Resistor(name, cp.resistance));
            }
        }

        return initialComponents;
    } catch(err) {
        console.log(err);
        return [];
    }
}

const getInitialCircuitInfo = (components, nodeRule) => {
    const nextNodes = components.map(cp => cp.nextNode);
    const allNodes = nodeRule.reduce((a, c) => [...a, ...c], []);

    if(nextNodes.length > 0 && nextNodes.every(node => allNodes.includes(node))) {
        let circuit;

        try {
            circuit = new Circuit(...components).applyRule(nodeRule).solve();
            return circuit;
        } catch(err) {
            console.error(err);
            return {};
        }
    } else {
        return {};
    }
}

const getInitialEquivCircuitString = circuitInfo => {
    if(Object.keys(circuitInfo).length > 0) {
        try {
            return circuitInfo.getEquivCircuitString();
        } catch(err) {
            console.error(err);
            return '';
        }
    } else {
        return '';
    }
}

export default function CircuitApp({ componentsURI, positionsURI, nodeRuleURI }) {
    const Router = useRouter();

    const [components, setComponents] = useState(componentsURI ? getInitialComponents(componentsURI) : []);
    const [positions, setPositions] = useState(positionsURI ? JSON.parse(decodeURIComponent(positionsURI)) : {});
    const [nodeRule, setNodeRule] = useState(nodeRuleURI ? JSON.parse(decodeURIComponent(nodeRuleURI)) : []);
    const [voltageCount, setVoltageCount] = useState(components.filter(cp => (cp instanceof Voltage && !(cp instanceof Wire))).length);
    const [wireCount, setWireCount] = useState(components.filter(cp => cp instanceof Wire).length);
    const [resistorCount, setResistorCount] = useState(components.filter(cp => cp instanceof Resistor).length);
    const [noMoreCp, setNoMoreCp] = useState(voltageCount + wireCount + resistorCount <= 24);
    const [circuitInfo, setCircuitInfo] = useState(getInitialCircuitInfo(components, nodeRule));
    const [equivCircuitString, setEquivCircuitString] = useState(getInitialEquivCircuitString(circuitInfo));

    const [hydrated, setHydrated] = useState(false);

    const [open, setOpen] = useState(false);

    // useEffect(() => {
    //     const newPositions = Object.assign({}, positions);
    //     let changed = false;

    //     const allComponentNames = Object.keys(newPositions);
    //     for(const currentComponentName of allComponentNames) {
    //         const currentPosition = positions[currentComponentName];
    //         const otherComponentNames = allComponentNames.filter(cpName => cpName !== currentComponentName);

    //         for(const otherComponentName of otherComponentNames) {
    //             const otherPosition = positions[otherComponentName];

    //             if(
    //                 (Math.abs(currentPosition.prev.x - otherPosition.prev.x) > 0 &&
    //                 Math.abs(currentPosition.prev.x - otherPosition.prev.x) <= 20) ||
    //                 (Math.abs(currentPosition.prev.y - otherPosition.prev.y) > 0 &&
    //                 Math.abs(currentPosition.prev.y - otherPosition.prev.y) <= 20)
    //             ) {
    //                 newPositions[otherComponentName].prev = currentPosition.prev;
    //                 changed = true;
    //             } else if(
    //                 (Math.abs(currentPosition.prev.x - otherPosition.next.x) > 0 &&
    //                 Math.abs(currentPosition.prev.x - otherPosition.next.x) <= 20) ||
    //                 (Math.abs(currentPosition.prev.y - otherPosition.next.y) > 0 &&
    //                 Math.abs(currentPosition.prev.y - otherPosition.next.y) <= 20)
    //             ) {
    //                 newPositions[otherComponentName].next = currentPosition.prev;
    //                 changed = true;
    //             } else if(
    //                 (Math.abs(currentPosition.next.x - otherPosition.prev.x) > 0 &&
    //                 Math.abs(currentPosition.next.x - otherPosition.prev.x) <= 20) ||
    //                 (Math.abs(currentPosition.next.y - otherPosition.prev.y) > 0 &&
    //                 Math.abs(currentPosition.next.y - otherPosition.prev.y) <= 20)
    //             ) {
    //                 newPositions[otherComponentName].prev = currentPosition.next;
    //                 changed = true;
    //             } else if(
    //                 (Math.abs(currentPosition.next.x - otherPosition.next.x) > 0 &&
    //                 Math.abs(currentPosition.next.x - otherPosition.next.x) <= 20) ||
    //                 (Math.abs(currentPosition.next.y - otherPosition.next.y) > 0 &&
    //                 Math.abs(currentPosition.next.y - otherPosition.next.y) <= 20)
    //             ) {
    //                 newPositions[otherComponentName].next = currentPosition.next;
    //                 changed = true;
    //             }
    //         }
    //     }

    //     if(changed) setPositions(newPositions)
    // }, [positions]);

    useEffect(() => {
        setHydrated(true);
    }, []);
    useEffect(() => {
        let newNodeRule = {};
        let count = 1;
        let changed = false;

        function findNodeKeyConnectedToNode(node) {
            const nodeKeys = Object.keys(newNodeRule);
    
            for(const nodeKey of nodeKeys) {
                const connectedNodes = newNodeRule[nodeKey];
                if(connectedNodes.includes(node)) return nodeKey;
            }
    
            return undefined;
        }

        function pointAroundPoint(p1, p2, nodeCount1, nodeCount2) {
            if(
                Math.abs(p1.x - p2.x) <= 20 &&
                Math.abs(p1.x - p2.x) >= 0 &&
                // Math.abs(p1.y - p2.y) < 20 &&
                // Math.abs(p1.y - p2.y) >= 0
                Math.abs(p1.y - p2.y) - Math.abs(nodeCount2 - nodeCount1) * 20 < 20 &&
                Math.abs(p1.y - p2.y) - Math.abs(nodeCount2 - nodeCount1) * 20 >= 0
            ) {
                return true;
            } else {
                return false;
            }
        }

        const componentNames = Object.keys(positions);

        for(const componentName of componentNames) {
            const { prev, next } = positions[componentName];
            const nextNode = components.find(cp => cp.name === componentName)?.nextNode;

            if(!nextNode) continue;

            const nodeCount1 = nextNode / 2;

            const otherComponentNames = componentNames.filter(cpName => cpName !== componentName);
            for(const otherComponentName of otherComponentNames) {
                const { prev: otherPrev, next: otherNext } = positions[otherComponentName];

                const otherNextNode = components.find(cp => cp.name === otherComponentName)?.nextNode;

                if(!otherNextNode) continue;

                const nodeCount2 = otherNextNode / 2;

                if(pointAroundPoint(prev, otherPrev, nodeCount1, nodeCount2)) {
                    const node = components.find(cp => cp.name === componentName)?.prevNode;
                    const otherNode = components.find(cp => cp.name === otherComponentName)?.prevNode;

                    if(!node || !otherNode) continue;

                    const nodeKey = findNodeKeyConnectedToNode(node);
                    const otherNodeKey = findNodeKeyConnectedToNode(otherNode);

                    if(nodeKey && otherNodeKey) continue;
                    if(!nodeKey && !otherNodeKey) {
                        newNodeRule[++count] = [node, otherNode];
                        changed = true;

                        continue;
                    }

                    if(nodeKey) newNodeRule[nodeKey].push(otherNode);
                    else newNodeRule[otherNodeKey].push(node);
                    changed = true;
                } else if(pointAroundPoint(prev, otherNext, nodeCount1, nodeCount2)) {
                    const node = components.find(cp => cp.name === componentName)?.prevNode;
                    const otherNode = components.find(cp => cp.name === otherComponentName)?.nextNode;

                    if(!node || !otherNode) continue;

                    const nodeKey = findNodeKeyConnectedToNode(node);
                    const otherNodeKey = findNodeKeyConnectedToNode(otherNode);

                    if(nodeKey && otherNodeKey) continue;
                    if(!nodeKey && !otherNodeKey) {
                        newNodeRule[++count] = [node, otherNode];
                        changed = true;

                        continue;
                    }

                    if(nodeKey) newNodeRule[nodeKey].push(otherNode);
                    else newNodeRule[otherNodeKey].push(node);
                    changed = true;
                } else if(pointAroundPoint(next, otherPrev, nodeCount1, nodeCount2)) {
                    const node = components.find(cp => cp.name === componentName)?.nextNode;
                    const otherNode = components.find(cp => cp.name === otherComponentName)?.prevNode;

                    if(!node || !otherNode) continue;

                    const nodeKey = findNodeKeyConnectedToNode(node);
                    const otherNodeKey = findNodeKeyConnectedToNode(otherNode);

                    if(nodeKey && otherNodeKey) continue;
                    if(!nodeKey && !otherNodeKey) {
                        newNodeRule[++count] = [node, otherNode];
                        changed = true;

                        continue;
                    }

                    if(nodeKey) newNodeRule[nodeKey].push(otherNode);
                    else newNodeRule[otherNodeKey].push(node);
                    changed = true;
                } else if(pointAroundPoint(next, otherNext, nodeCount1, nodeCount2)) {
                    const node = components.find(cp => cp.name === componentName)?.nextNode;
                    const otherNode = components.find(cp => cp.name === otherComponentName)?.nextNode;

                    if(!node || !otherNode) continue;

                    const nodeKey = findNodeKeyConnectedToNode(node);
                    const otherNodeKey = findNodeKeyConnectedToNode(otherNode);

                    if(nodeKey && otherNodeKey) continue;
                    if(!nodeKey && !otherNodeKey) {
                        newNodeRule[++count] = [node, otherNode];
                        changed = true;

                        continue;
                    }

                    if(nodeKey) newNodeRule[nodeKey].push(otherNode);
                    else newNodeRule[otherNodeKey].push(node);
                    changed = true;
                }
            }
        }

        setNodeRule(Object.values(newNodeRule));
    }, [positions, components]);

    // console.log(circuitInfo);

    useEffect(() => {
        const nodes = components.map(cp => ({ prev: cp.prevNode, next: cp.nextNode }));
        const allNodes = nodeRule.reduce((a, c) => [...a, ...c], []);

        if(nodes.length > 0 && nodes.every(node => allNodes.includes(node.prev) || allNodes.includes(node.next))) {
            let circuit;
            let circuitInfoCounter = 0;
            let equivCounter = 0;

            while(circuitInfoCounter > 2) {
                try {
                    circuit = new Circuit(...components).applyRule(nodeRule).solve();
                    setCircuitInfo(circuit);
                    circuitInfoCounter = 3;
                } catch(err) {
                    circuitInfoCounter++;

                    if(circuitInfoCounter > 2) {
                        console.error(err);
                        setCircuitInfo({});
                    }
                }
            }

            while(equivCounter > 2) {
                try {
                    if(components.filter(cp => cp instanceof Voltage && !(cp instanceof Wire)).length === 1) {
                        setEquivCircuitString(circuit.getEquivCircuitString());
                        equivCounter = 3;
                    }
                } catch(err) {
                    equivCounter++;

                    if(equivCounter > 2) {
                        console.error(err);
                        setEquivCircuitString('');
                    }
                }
            }
        } else {
            setCircuitInfo({});
            setEquivCircuitString('');
        }
    }, [nodeRule]);

    useEffect(() => {
        if(voltageCount + resistorCount + wireCount >= 24) {
            setNoMoreCp(true);
        } else {
            setNoMoreCp(false);
        }
    }, [voltageCount, resistorCount, wireCount]);

    useEffect(() => {
        const nodeRuleURI = encodeURIComponent(JSON.stringify(nodeRule));
        const componentsURI = encodeURIComponent(JSON.stringify(components.map(cp => {
            let result = { name: cp.name };

            if(cp instanceof Voltage && !(cp instanceof Wire)) result.voltage = cp.voltage;
            else if(cp instanceof Resistor) result.resistance = cp.resistance;

            return result;
        })));
        const positionsURI = encodeURIComponent(JSON.stringify(positions));

        Router.push({
            pathname: '/simulation/circuit',
            query: {
                nodeRuleURI: nodeRuleURI,
                componentsURI: componentsURI,
                positionsURI: positionsURI
            }
        }, undefined, { shallow: true });
    }, [nodeRule, components, positions]);

    function deletaAllComponents() {
        Node.nodeCount = 0;
        setNoMoreCp(false);
        setVoltageCount(0);
        setResistorCount(0);
        setWireCount(0);
        setComponents([]);
        setNodeRule([]);
        setPositions({});
        const nodeRuleURI = encodeURIComponent(JSON.stringify([]));
        const componentsURI = encodeURIComponent(JSON.stringify([].map(cp => {
            let result = { name: cp.name };

            if(cp instanceof Voltage && !(cp instanceof Wire)) result.voltage = cp.voltage;
            else if(cp instanceof Resistor) result.resistance = cp.resistance;

            return result;
        })));
        const positionsURI = encodeURIComponent(JSON.stringify({}));

        Router.push({
            pathname: '/simulation/circuit',
            query: {
                nodeRuleURI: nodeRuleURI,
                componentsURI: componentsURI,
                positionsURI: positionsURI
            }
        }, undefined, { shallow: true });

        // for sake of safety
        Router.push({
            pathname: '/simulation/circuit',
            query: {
                nodeRuleURI: nodeRuleURI,
                componentsURI: componentsURI,
                positionsURI: positionsURI
            }
        }, undefined, { shallow: true });
    }

    function placeVoltage() {
        if(noMoreCp) return;

        setComponents(prev => {
            const newComponents = [...prev];
            newComponents.push(new Voltage(`V${voltageCount + 1}`, 1));
            return newComponents
        });
        setVoltageCount(prev => ++prev);
    }

    function placeWire() {
        if(noMoreCp) return;

        setComponents(prev => {
            const newComponents = [...prev];
            newComponents.push(new Wire(`W${wireCount + 1}`, 1));
            return newComponents
        });
        setWireCount(prev => ++prev);
    }

    function placeResistor() {
        if(noMoreCp) return;

        setComponents(prev => {
            const newComponents = [...prev];
            newComponents.push(new Resistor(`R${resistorCount + 1}`, 1));
            return newComponents
        });
        setResistorCount(prev => ++prev);
    }

    if (!hydrated) {
        // Returns null on first render, so the client and server match
        return null;
    }
    return (
        <div className={styles.container} >
            <div className={styles.centeredDiv} >
                <h1>Avrora 수능 물리학2 회로 시뮬레이션</h1>
                <div className={styles.menuButtons} >
                    <div>
                        <small>전압/전류 정보는 모든 소자가 연결되었을 때만 보여집니다.</small><br/>                       
                        <small>소자가 안 놓여지면 이 버튼을 또 누르기</small>
                    </div>
                    <Button
                        onClick={deletaAllComponents}
                        color="danger"
                        startDecorator={<Delete/>}
                    >
                        소자 전부 지우기
                    </Button>
                </div>
                <div className={styles.simulatorWrapper} >
                    <div className={styles.components} >
                        <h1>전기 소자</h1>
                        <hr/>
                        <div className={styles.inlineComponent} >
                            <h2>전원</h2>
                            <VoltageButton onClick={placeVoltage} />
                        </div>
                        <div className={styles.inlineComponent} >
                            <h2>도선</h2>
                            <WireButton onClick={placeWire} />
                        </div>
                        <div className={styles.inlineComponent} >
                            <h2>저항</h2>
                            <ResistorButton onClick={placeResistor} />
                        </div>
                        <div className={styles.inlineComponent} >
                            <h3 style={{ fontSize: '1rem', textDecoration: 'line-through', color: 'gray' }} >스위치</h3>
                            <BinarySwitchButton/>
                        </div>
                        <hr/>
                        <small>
                            여기에 있는 소자를 클릭하면 소자를 놓을 수 있습니다
                        </small>
                    </div>
                    <div className={styles.field} id="field" >
                        <div>
                            {
                                components.map(component => {
                                    if(component instanceof Voltage && !(component instanceof Wire)) {
                                        return <VoltageDraggable key={component.name} component={component} positions={positions} setPositions={setPositions} setNodeRule={setNodeRule} setComponents={setComponents} circuitInfo={circuitInfo} />
                                    } else if(component instanceof Wire) {
                                        return <WireDraggable key={component.name} component={component} positions={positions} setPositions={setPositions} setNodeRule={setNodeRule} setComponents={setComponents} circuitInfo={circuitInfo} />
                                    } else if(component instanceof Resistor) {
                                        return <ResistorDraggable key={component.name} component={component} positions={positions} setPositions={setPositions} setNodeRule={setNodeRule} setComponents={setComponents} circuitInfo={circuitInfo} />
                                    }
                                })
                            }
                        </div>
                    </div>
                    <div className={styles.datas} >
                        {
                            Object.keys(circuitInfo).length > 0 ?
                                <>
                                    {
                                        equivCircuitString.length > 0 ?
                                            <Button color="neutral" onClick={() => setOpen(true)} >등가회로 보기</Button> : null 
                                    }
                                    <small>전압</small>
                                    <br/>
                                    {
                                        Object.keys(circuitInfo.normalizedVolts)
                                        .map(cpName => (
                                            <>
                                                <span key={`${cpName}_normalizedVolt`} >
                                                    <h4 style={{ display: 'inline' }} >{cpName}</h4>
                                                    &nbsp;
                                                    <p style={{ display: 'inline' }} >{circuitInfo.normalizedVolts[cpName]} V</p>
                                                </span>
                                                <br/>
                                            </>
                                        ))
                                    }
                                    <br/>
                                    <small>전류</small>
                                    <br/>
                                    {
                                        Object.keys(circuitInfo.normalizedCurrents)
                                        .map(cpName => (
                                            <>
                                                <span key={`${cpName}_normalizedCurrent`} >
                                                    <h4 style={{ display: 'inline' }} >{cpName}</h4>
                                                    &nbsp;
                                                    <p style={{ display: 'inline' }} >{circuitInfo.normalizedCurrents[cpName]} A</p>
                                                </span>
                                                <br/>
                                            </>
                                        ))
                                    }
                                </> : null
                        }
                    </div>
                </div>
                <br/>
                <hr/>
                <Button sx={{ m: 1, ml: 0 }} component="a" href="/simulation" startDecorator={<ArrowBack/>} variant="outlined" >뒤로 가기</Button>
                <div>
                    <small>현재는 전원, 도선, 저항만 지원합니다</small>
                    <br/>
                    <small>등가 회로는 전원이 1개일 때에, 직병렬 등가 회로가 가능할 때만 그려집니다</small>
                    {/* <br/>
                    <small>개별 소자 삭제 기능은 오류나서 보강중</small> */}
                </div>
            </div>
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
                <Sheet
                    variant="outlined"
                    sx={{
                        maxWidth: 500,
                        borderRadius: 'md',
                        p: 3,
                        boxShadow: 'lg'
                    }}
                >
                    <ModalClose variant="plain" sx={{ m: 1 }} />
                    <Typography
                        component="h2"
                        level="h4"
                        textColor="inherit"
                        fontWeight="lg"
                        mb={1}
                    >
                        등가 회로
                    </Typography>
                    <Typography  fontWeight="lg" textColor="text.tertiary" >
                        {equivCircuitString}
                    </Typography>
                    <hr/>
                    <small>
                        +는 전원의 양(+)극을 나타냅니다.
                    </small>
                    <br/>
                    <small>
                        -는 전원의 음(-)극을 나타냅니다.
                    </small>
                    <br/>
                    <small>
                        ||는 두 저항이 병렬로 연결되어 있음을 의미합니다.
                    </small>
                    <br/>
                    <small>
                        ^는 두 저항이 직렬로 연결되어 있음을 의미합니다.
                    </small>
                </Sheet>
            </Modal>
        </div>
    )
}

CircuitApp.getInitialProps = async({ query }) => {
    return query;
}