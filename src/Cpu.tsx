import { 
    FunctionComponent as FC,
    useState,
} from 'react';
import structuredClone from '@ungap/structured-clone';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

interface CpuProps {

}

const initialCpuState = {
    instruction: 0,
    ip: 0,
    acc: 0,
    index: 0,
    memory: [],
};

const Cpu: FC<CpuProps> = (props) => {
    const [cpuState, setCpuState] = useState(() => {
        return structuredClone(initialCpuState);
    });

    return (
        <Box>
            <Typography variant="h5" component="div">CPU State</Typography>
            <Grid container spacing={2}>
                <Grid item xs={3}>Instruction:</Grid>
                <Grid item xs={9}>{cpuState.instruction}</Grid>
                <Grid item xs={3}>Inst Pointer:</Grid>
                <Grid item xs={9}>{cpuState.ip}</Grid>
                <Grid item xs={3}>Accumulator:</Grid>
                <Grid item xs={9}>{cpuState.acc}</Grid>
                <Grid item xs={3}>Index Register:</Grid>
                <Grid item xs={9}>{cpuState.index}</Grid>
            </Grid>
        </Box>
    );
};

export default Cpu;
