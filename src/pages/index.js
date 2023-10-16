import styles from './index.module.scss';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { AccountBalance } from '@mui/icons-material';

export default function App() {
  return (
    <div className={styles.container} >
      <div className={styles.centeredDiv} >
        <h1 style={{ textDecoration: 'underline' }} >Avrora Note</h1>
        <h2>대학수학능력시험 물리학2 유틸 저장소</h2>
        <hr/>
        <Button component="a" href="/simulation" sx={{ m: 1, ml: 0 }} startDecorator={<RocketLaunchIcon/>} >시뮬레이션</Button>
        <br/>
        <Button sx={{ m: 1, ml: 0 }} startDecorator={<AccountBalance/>} disabled >기출 문제 은행</Button>
        <hr/>
        <h3>시뮬레이션</h3>
        <h4> - 회로 시뮬레이션 개발중</h4>
        <p className={styles.gray} > - 포물선 시뮬 개발 계획중</p>
        <p className={styles.gray} > - 렌즈 시뮬 개발 대기</p>
        <h3>기출 문제 은행</h3>
        <p className={styles.gray} > - 평가원 문제 은행 개발 계획중</p>
        <p className={styles.gray} > - 교육청 문제 은행 개발 대기</p>
      </div>
    </div>
  )
}