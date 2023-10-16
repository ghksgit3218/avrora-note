import Draggable from 'react-draggable';
import SvgIcon from '@mui/joy/SvgIcon';
import { useEffect, useState } from 'react';
import styles from './WireDraggable.module.scss';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { ListItemIcon, ListItemText } from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import Modal from '@mui/joy/Modal';
import ModalClose from '@mui/joy/ModalClose';
import Sheet from '@mui/joy/Sheet';
import { Button, FormControl, FormLabel, Input } from '@mui/joy';

export default function ResistorDraggable({ positions, component, setPositions, setComponents, circuitInfo }) {
    const { prevNode, nextNode, name, resistance } = component

    const [current, setCurrent] = useState(circuitInfo?.current || 0);
    // const [voltage, setVoltage] = useState(circuitInfo?.voltage || 0);

    const [prevEP, setPrevEP] = useState(null);
    const [nextEP, setNextEP] = useState(null);
    const [prevAnchorPosition, setPrevAnchorPosition] = useState((positions[name]?.prev || { x : 0, y : 0 }));
    const [nextAnchorPosition, setNextAnchorPosition] = useState((positions[name]?.next || { x : 0, y : 0 }));

    const [adjacentNode, setAdjacentNode] = useState(null);

    const [wirePosition, setWirePosition] = useState(({ x: 0, y: 0 }));

    const [wireLength, setWireLength] = useState(100);
    const [wireAngle, setWireAngle] = useState(0);
    const [wireLeft, setWireLeft] = useState(0);
    const [wireTop, setWireTop] = useState(0);

    const [openEditModal, setOpenEditModal] = useState(false);

    const [voltage, setVoltage] = useState(resistance);

    const handleVoltageChange = v => {
        if(/\d+/g.test(v)) {
            setVoltage(v);
            component.resistance = v;
        }
    }

    const [contextMenu, setContextMenu] = useState(null);

    const handleContextMenu = e => {
        e.preventDefault();
        
        setContextMenu(
            contextMenu === null ?
                {
                    mouseX: e.clientX + 2,
                    mouseY: e.clientY - 6
                } : null
        );
    }

    const handleCloseContextMenu = () => setContextMenu(null);

    const handleComponentDelete = () => {
        setComponents(prev => {
            return [...prev].filter(cp => cp.name !== name)
        })
    }

    const handlePrevAnchorDrag = (e, ui) => {
        let { x, y } = ui;

        x = Math.floor(x / 20) * 20;
        y = Math.floor(y / 20) * 20;

        if(0 <= x && x <= 475 && 0 - (nextNode / 2 - 1) * 20 <= y && y <= 475 && Math.abs(x - nextAnchorPosition.x) >= 10) {
            setPrevAnchorPosition({ x, y });
            setPositions(prev => {
                const newPositions = Object.assign({}, prev);
                newPositions[name] = {
                    prev: { x, y },
                    next: prev[name]?.next || nextAnchorPosition
                }

                return newPositions;
            });
        }
    }
    const handleNextAnchorDrag = (e, ui) => {
        let { x, y } = ui;

        x = Math.floor(x / 20) * 20;
        y = Math.floor(y / 20) * 20;

        if(0 <= x && x < 475 && 0 - (nextNode / 2 - 1) * 20 <= y && y <= 475 && Math.abs(x - prevAnchorPosition.x) >= 10) {
            setNextAnchorPosition({ x, y });
            setPositions(prev => {
                const newPositions = Object.assign({}, prev);
                newPositions[name] = {
                    prev: prev[name]?.prev || nextAnchorPosition,
                    next: { x, y }
                }

                return newPositions;
            });
        }
    }

    const handleAnchorDragEnd = () => {
        if(!!adjacentNode) {
            
            const wireEl = document.getElementById(`component${name}`);
            const adjacentEl = document.getElementById(`component${adjacentNode.name}`);
            
            if(!wireEl || !adjacentEl) {            
                setAdjacentNode(null);
            }
            
            wireEl.style.borderColor = 'black';
            adjacentEl.style.borderColor = 'black';
            setAdjacentNode(null);
        }
    }

    const handleWireDrag = (e, ui) => {
        const { x, y, deltaX, deltaY } = ui;

         setWirePosition({ x, y });
         setPrevAnchorPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
         setNextAnchorPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    }

    useEffect(() => {
        setNextAnchorPosition(prev => ({ x: prev.x + 1, y: prev.y }));
    }, []);


    const findNodeKeyConnectedToNode = node => {
        const nodeKeys = Object.keys(circuitInfo.nodes);

        for(const nodeKey of nodeKeys) {
            const connectedNodes = circuitInfo.nodes[nodeKey];
            if(connectedNodes.includes(node)) return nodeKey;
        }

        return undefined;
    }

    useEffect(() => {
        if(Object.keys(circuitInfo).length > 0) {
            const { connections } = circuitInfo;

            const prevNodeKey = findNodeKeyConnectedToNode(prevNode);
            const nextNodeKey = findNodeKeyConnectedToNode(nextNode);

            const newPrevEP = connections[prevNodeKey]?.normalizedElectricPotential;
            const newNextEP = connections[nextNodeKey]?.normalizedElectricPotential;
            setPrevEP(newPrevEP);
            setNextEP(newNextEP);
        } else {
            setPrevEP(null);
            setNextEP(null);
        }
    }, [circuitInfo]);
    
    useEffect(() => {
        const prevAnchor = document.getElementById(`component${name}_prevAnchor`);
        const nextAnchor = document.getElementById(`component${name}_nextAnchor`);

        if(!prevAnchor || !nextAnchor) return;

        const { left: prevLeft, top: prevTop, width: prevWidth, height: prevHeight } = prevAnchor.getBoundingClientRect();
        const { left: nextLeft, top: nextTop, width: nextWidth, height: nextHeight } = nextAnchor.getBoundingClientRect();

        const prevAnchorX = prevLeft + window.scrollX + (prevWidth || prevAnchor.offsetWidth) / 2;
        const prevAnchorY = prevTop + window.scrollY + (prevHeight || prevAnchor.offsetHeight) / 2;
        const nextAnchorX = nextLeft + window.scrollX + (nextWidth || nextAnchor.offsetWidth) / 2;
        const nextAnchorY = nextTop + window.scrollY + (nextHeight || nextAnchor.offsetHeight) / 2;

        const wL = Math.sqrt((nextAnchorX - prevAnchorX) * (nextAnchorX - prevAnchorX) + (nextAnchorY - prevAnchorY) * (nextAnchorY - prevAnchorY));
        const wa = Math.atan2(nextAnchorY - prevAnchorY, nextAnchorX - prevAnchorX) * 180 / Math.PI;
        // setWireLength(Math.sqrt((nextAnchorX - prevAnchorX) * (nextAnchorX - prevAnchorX) + (nextAnchorY - prevAnchorY) * (nextAnchorY - prevAnchorY)));
        // setWireAngle(Math.atan2(nextAnchorY - prevAnchorY, nextAnchorX - prevAnchorX) * 180 / Math.PI);
    
        // console.log(prevAnchorPosition, nextAnchorPosition, styles.wire)

        const wLft = Math.round(((prevAnchorX + nextAnchorX) / 2 - wL / 2) * 5) / 5;
        const wTp = Math.round(((prevAnchorY + nextAnchorY) / 2 - 2 / 2) * 5) / 5;
        // setWireLeft(Math.round(((prevAnchorX + nextAnchorX) / 2 - wL / 2) * 5) / 5);
        // setWireTop(Math.round(((prevAnchorY + nextAnchorY) / 2 - 2 / 2) * 5) / 5);

        const wireEl = document.getElementById(`component${name}`);

        if(!wireEl) return;

        wireEl.style.width = wL + 'px';
        wireEl.style.transform = `rotate(${wa}deg)`;
        wireEl.style.left = wLft + 'px';
        wireEl.style.top = wTp + 'px';

        const nameEl = document.getElementById(`component${name}_name`);

        if(!nameEl) return;

        let nameElLeftOffset = 0;
        let nameElTopOffset = 0;
        if(0 < wa && wa < 45) nameElLeftOffset = -20;
        else if(45 <= wa && wa < 90) {
            nameElLeftOffset = 10;
            nameElTopOffset = -20;
        } else if(-180 < wa && wa <= -135) {
            nameElLeftOffset = 10;
            nameElTopOffset = -20;
        } else if(-135 <= wa && wa < -70) {
            nameElLeftOffset = -30;
        }
        nameEl.style.left = (prevAnchorX + nextAnchorX) / 2 + nameElLeftOffset + 'px';
        nameEl.style.top = (prevAnchorY + nextAnchorY) / 2 + nameElTopOffset + 'px';
        nameEl.style.zIndex = -10;

        const prevEPEl = document.getElementById(`component${name}_prevEP`);
        const nextEPEl = document.getElementById(`component${name}_nextEP`);

        if(!prevEPEl || !nextEPEl) return;

        prevEPEl.style.left = prevAnchorX - 10 + 'px';
        prevEPEl.style.top = prevAnchorY + 'px';
        prevEPEl.style.zIndex = -10;
        nextEPEl.style.left = nextAnchorX - 10 + 'px';
        nextEPEl.style.top = nextAnchorY + 'px';
        nextEPEl.style.zIndex = -10;

        const iconEl = document.getElementById(`component${name}_icon`);

        if(!iconEl) return;

        iconEl.style.left = (prevAnchorX + nextAnchorX) / 2 - 20 + 'px';
        iconEl.style.top = (prevAnchorY + nextAnchorY) / 2 - 20 + 'px';
        iconEl.style.transform = `rotate(${wa}deg)`;

        const voltageEl = document.getElementById(`component${name}_voltage`);
        
        if(!voltageEl) return;

        let voltageElLeftOffset = 0;
        let voltageElTopOffset = 0;
        if(0 < wa && wa < 45) {
            voltageElLeftOffset = -10;
            voltageElTopOffset = -40;
        }
        else if(-70 <= wa && wa < 0) {
            voltageElLeftOffset = -20;
            voltageElTopOffset = -30;
        }
        else if(-135 <= wa && wa < -90) {
            voltageElLeftOffset = 10;
            voltageElTopOffset = -30;
        }
        else if(wa === -135) {
            voltageElLeftOffset = -20;
            voltageElTopOffset = 30;
        }
        else if(90 <= wa && wa <= 180) {
            voltageElLeftOffset = -30;
            voltageElTopOffset = -30;
        }
        else if(45 <= wa && wa < 90) {
            voltageElLeftOffset = -30;
            voltageElTopOffset = -10;
        } else if(-180 < wa && wa <= -135) {
            voltageElLeftOffset = 10;
            voltageElTopOffset = 20;
        } else if(-90 <= wa && wa < -70) {
            voltageElLeftOffset = 20;
        } else if(-135 <= wa && wa < -70) {
            voltageElLeftOffset = -30;
        } else if(wa === 0) {
            voltageElTopOffset = -30;
        }
        voltageEl.style.left =  (prevAnchorX + nextAnchorX) / 2 + voltageElLeftOffset + 'px';
        voltageEl.style.top =  (prevAnchorY + nextAnchorY) / 2 + voltageElTopOffset + 'px';
    }, [prevAnchorPosition, nextAnchorPosition]);

    return (
        <div key={nextNode} >
             <div className={styles.container} >
                <Draggable
                    onDrag={handlePrevAnchorDrag}
                    onStop={handleAnchorDragEnd}
                    position={prevAnchorPosition}
                    grid={[20, 20]}
                >
                    <div className={styles.anchorWrapper} id={`component${name}_prevAnchor`} >
                        <div className={`${styles.anchor} ${styles.prevNode}`} />
                    </div>
                </Draggable>
                <div className={styles.wireWrapper} >
                </div>
                <Draggable
                    onDrag={handleNextAnchorDrag}
                    onStop={handleAnchorDragEnd}
                    position={nextAnchorPosition}
                    grid={[20, 20]}
                >
                    <div className={styles.anchorWrapper} id={`component${name}_nextAnchor`} >
                        <div className={`${styles.anchor} ${styles.nextNode}`} />
                    </div>
                </Draggable>
            </div>
            <div
                onContextMenu={handleContextMenu}
                id={`component${name}`}
                className={`${styles.wire}`}
                // style={{
                //     width: `${wireLength}px`,
                //     transform: `rotate(${wireAngle}deg)`,
                //     left: `${wireLeft}px`,
                //     top: `${wireTop}px`
                // }}
            />
            <div className={styles.info} >
                <div id={`component${name}_voltage`} >{resistance} Ω</div>
                <div id={`component${name}_name`} >{name}</div>
                <div id={`component${name}_prevEP`} >{prevEP}</div>
                <div id={`component${name}_nextEP`} >{nextEP}</div>
                
            <div className={styles.icon} id={`component${name}_icon`} onContextMenu={handleContextMenu} >
                <SvgIcon fontSize="xl4" >
                    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                    width="585.000000pt" height="584.000000pt" viewBox="0 0 585.000000 584.000000"
                    preserveAspectRatio="xMidYMid meet">

                    <g transform="translate(0.000000,584.000000) scale(0.100000,-0.100000)"
                    fill="#000000" stroke="none">
                    <path d="M1135 3585 l-220 -455 -452 0 -453 0 0 -210 0 -210 515 0 515 0 0
                    105 0 105 90 -45 c49 -25 92 -45 95 -45 3 0 34 57 69 128 l64 127 54 -115
                    c141 -294 560 -1156 567 -1163 4 -4 146 280 317 632 170 351 312 637 315 635
                    3 -1 144 -289 314 -639 170 -349 312 -632 316 -628 4 5 143 289 309 633 166
                    344 305 628 309 633 4 4 146 -281 317 -633 170 -352 311 -640 314 -640 3 0
                    104 205 225 455 l219 455 453 0 453 0 0 210 0 210 -515 0 -515 0 0 -105 c0
                    -58 -2 -105 -5 -105 -3 0 -46 21 -96 46 -50 25 -92 44 -94 42 -1 -2 -29 -58
                    -60 -125 -32 -68 -61 -123 -64 -123 -4 0 -146 288 -316 640 -171 351 -313 636
                    -316 632 -3 -4 -144 -294 -314 -645 l-309 -638 -96 198 c-52 109 -192 397
                    -310 641 -118 243 -217 442 -220 442 -4 0 -112 -217 -240 -482 -129 -266 -268
                    -554 -311 -640 l-77 -157 -272 562 c-150 309 -291 599 -314 645 l-41 82 -220
                    -455z"/>
                    </g>
                    </svg>
                </SvgIcon>
            </div>
            <Menu
                open={contextMenu !== null}
                onClose={handleCloseContextMenu}
                anchorReference='anchorPosition'
                anchorPosition={
                    contextMenu !== null ?
                        { top: contextMenu.mouseY, left: contextMenu.mouseX  } : undefined   
                }
            >
                <h4 style={{ margin: 0, marginLeft: 10 }} >{name}</h4>
                <MenuItem onClick={() => setOpenEditModal(true)} >
                    <ListItemIcon>
                        <Edit fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>
                        저항 조절하기
                    </ListItemText>
                </MenuItem>
                {/* <MenuItem onClick={() => {
                    handleComponentDelete();
                    handleCloseContextMenu();
                }} >
                    <ListItemIcon>
                        <Delete fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>
                        소자 삭제하기
                    </ListItemText>
                </MenuItem> */}
            </Menu>

            <Modal
                open={openEditModal}
                onClose={() => {
                    setOpenEditModal(false);
                    handleCloseContextMenu();
                }}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <Sheet
                    variant="outlined"
                    sx={{
                        minWidth: 200,
                        borderRadius: 'md',
                        p: 3
                    }}
                >
                    <ModalClose variant="outlined" />
                    <h3>{name} 저항 조절하기</h3>
                    <FormControl sx={{ mb: 1 }} >
                        <FormLabel>저항 (Ω)</FormLabel>
                        <Input autoFocus defaultValue={resistance} onChange={({ target: { value } }) => handleVoltageChange(+value)} />
                    </FormControl>
                    <small>숫자만 입력 가능합니다</small>
                    <br/>
                    <br/>
                    <Button
                        onClick={() => {
                            setOpenEditModal(false);
                        }}
                        startDecorator={<Edit/>}
                        variant="outlined"
                    >
                        변경
                    </Button>
                </Sheet>
            </Modal>
            </div>
        </div>
    )
}