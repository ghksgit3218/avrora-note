import Button from '@mui/joy/Button';
import SvgIcon from '@mui/joy/SvgIcon';

export default function WireButton({ onClick }) {
    return (
        <Button
            onClick={onClick}
            sx={{ m: 1, width: 50, height: 50, pl: 1, pr: 1 }}
            variant="outlined"
            startDecorator={
            <SvgIcon fontSize="xl4" sx={{ ml: 1 }} >
<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="535.000000pt" height="535.000000pt" viewBox="0 0 535.000000 535.000000"
 preserveAspectRatio="xMidYMid meet">

<g transform="translate(0.000000,535.000000) scale(0.100000,-0.100000)"
fill="#000000" stroke="none">
<path d="M2530 2825 l-2065 -2065 148 -147 147 -148 2060 2060 c1133 1133
2060 2065 2060 2070 0 6 -64 74 -143 153 l-142 142 -2065 -2065z"/>
</g>
</svg>

        </SvgIcon>}
        />
    )
}