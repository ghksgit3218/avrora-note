import Button from '@mui/joy/Button';
import SvgIcon from '@mui/joy/SvgIcon';

export default function VoltageButton({ onClick }) {
    return (
        <Button
            sx={{ m: 1, width: 50, height: 50, pl: 1, pr: 1 }}
            variant="outlined"
            color="danger"
            onClick={onClick}
            startDecorator={
            <SvgIcon fontSize="xl4" sx={{ ml: 1 }} >
<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="535.000000pt" height="535.000000pt" viewBox="0 0 535.000000 535.000000"
 preserveAspectRatio="xMidYMid meet">

<g transform="translate(0.000000,535.000000) scale(0.100000,-0.100000)"
fill="#000000" stroke="none">
<path d="M3857 4152 l-737 -737 -310 310 -310 310 -225 -225 c-124 -124 -225
-229 -225 -235 0 -13 1512 -1525 1525 -1525 6 0 111 101 235 225 l225 225
-310 310 -310 310 738 738 737 737 -148 148 -147 147 -738 -738z"/>
<path d="M910 3495 l-145 -145 573 -573 572 -572 -722 -722 -723 -723 148
-147 147 -148 723 723 722 722 570 -570 570 -570 147 147 148 148 -1287 1287
c-709 709 -1290 1288 -1293 1288 -3 0 -70 -65 -150 -145z"/>
</g>
</svg>
        </SvgIcon>}
        />
    )
}