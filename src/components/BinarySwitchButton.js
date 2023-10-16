import Button from '@mui/joy/Button';
import SvgIcon from '@mui/joy/SvgIcon';

export default function BinarySwitchButton() {
    return (
        <Button
            disabled
            sx={{ m: 1, width: 50, height: 50, pl: 1, pr: 1 }}
            startDecorator={
            <SvgIcon fontSize="xl4" sx={{ ml: 1 }} >
<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="534.000000pt" height="535.000000pt" viewBox="0 0 534.000000 535.000000"
 preserveAspectRatio="xMidYMid meet">

<g transform="translate(0.000000,535.000000) scale(0.100000,-0.100000)"
fill="#000000" stroke="none">
<path d="M4185 4490 l-400 -400 -50 6 c-105 13 -229 -32 -316 -113 -210 -196
-154 -550 106 -669 210 -96 445 -13 547 193 32 65 33 73 34 186 l0 118 390
390 389 389 -150 150 -150 150 -400 -400z m-441 -694 c108 -45 100 -193 -13
-227 -71 -21 -151 40 -151 116 0 42 34 93 73 110 41 18 50 18 91 1z"/>
<path d="M1965 3284 l-310 -1136 -62 -28 c-84 -38 -165 -117 -205 -198 -29
-58 -33 -77 -36 -166 l-4 -101 -446 -447 -447 -448 145 -145 c80 -80 149 -145
155 -145 6 0 208 197 449 439 l439 439 36 -10 c46 -13 163 -4 221 17 252 89
352 418 191 631 l-37 49 312 1135 c171 624 310 1136 308 1138 -1 3 -398 113
-399 112 0 0 -139 -511 -310 -1136z m-134 -1445 c54 -38 63 -127 18 -175 -53
-56 -128 -56 -178 2 -96 108 41 256 160 173z"/>
</g>
</svg>
        </SvgIcon>}
        />
    )
}