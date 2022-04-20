import { 
    FunctionComponent as FC,
} from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

interface CpuStateProps {
    instructionPointer: number;
    accumulator: number;
    index: number;
}

const CpuState: FC<CpuStateProps> = (props) => {
    return (
        <Box>
            <Typography variant="h5" component="div">CPU State</Typography>
            <Grid container spacing={2}>
                <Grid item xs={3}>Instruction:</Grid>
                <Grid item xs={9}>xxx</Grid>
                <Grid item xs={3}>Inst Pointer:</Grid>
                <Grid item xs={9}>{props.instructionPointer}</Grid>
                <Grid item xs={3}>Accumulator:</Grid>
                <Grid item xs={9}>{props.accumulator}</Grid>
                <Grid item xs={3}>Index Register:</Grid>
                <Grid item xs={9}>{props.index}</Grid>
            </Grid>
        </Box>
    );
};

export default CpuState;
