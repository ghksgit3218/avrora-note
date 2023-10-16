import styles from './index.module.scss';
import { ArrowBack } from '@mui/icons-material';
import Button from '@mui/joy/Button';
import SvgIcon from '@mui/joy/SvgIcon';

export default function Simulation() {
    return (
        <div className={styles.container} >
            <div className={styles.centeredDiv} >
                <h1 style={{ textDecoration: 'underline' }} >Avrora Note</h1>
                <h2>물리학2 시뮬레이션 모음</h2>
                <hr/>
                <Button
                    sx={{ m: 1, ml: 0 }}
                    component="a"
                    href="/simulation/circuit"
                    variant="outlined"
                    startDecorator={
                    <SvgIcon>
                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                width="534.000000pt" height="534.000000pt" viewBox="0 0 534.000000 534.000000"
                preserveAspectRatio="xMidYMid meet">

                <g transform="translate(0.000000,534.000000) scale(0.100000,-0.100000)"
                fill="#000000" stroke="none">
                <path d="M4220 4515 l-365 -365 74 -74 73 -74 -96 -32 c-58 -19 -96 -37 -96
                -45 0 -8 18 -66 41 -130 22 -64 38 -119 35 -122 -3 -3 -306 98 -673 225 -366
                128 -668 231 -669 229 -1 -1 103 -303 231 -672 128 -368 230 -671 226 -673 -3
                -1 -305 102 -670 228 -365 127 -666 229 -668 226 -3 -3 99 -305 227 -671 127
                -367 230 -669 228 -670 -2 -2 -305 101 -673 229 -369 128 -671 232 -673 231
                -1 -1 72 -218 163 -481 l166 -478 -321 -321 -320 -320 148 -148 147 -147 363
                363 c199 199 362 366 362 372 0 5 -30 40 -67 77 -37 37 -65 69 -62 71 2 2 45
                18 94 36 l91 32 -44 130 c-25 71 -43 132 -40 134 2 2 302 -99 667 -226 365
                -126 666 -229 670 -227 4 2 -98 304 -226 672 -128 369 -231 671 -230 672 1 1
                304 -103 672 -231 369 -128 671 -229 673 -226 1 4 -101 306 -228 671 -127 365
                -228 665 -226 668 3 2 305 -100 672 -227 366 -128 668 -230 670 -228 2 2 -71
                216 -162 477 l-164 475 322 322 323 323 -145 145 c-80 80 -147 145 -150 145
                -3 0 -169 -164 -370 -365z"/>
                </g>
                </svg>
                </SvgIcon>}
                >
                    회로
                </Button>
                <hr/>
                <Button sx={{ m: 1, ml: 0 }} component="a" href="/" startDecorator={<ArrowBack/>} variant="outlined" >뒤로 가기</Button>
            </div>
        </div>
    )
}