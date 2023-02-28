import { 
    FunctionComponent as FC,
} from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Instruction } from './vm/program';

interface CpuStateProps {
    instruction: Instruction;
    instructionPointer: number;
    accumulator: number;
    index: number;
}

const sliceHex = (x: Uint8Array, start: number, end: number): string => {
    const padded: string[] = [];
    for (let i = start; i < end; i++) {
        const byte = x.at(i);
        if (byte === undefined) break;
        padded.push(byte.toString(16).padStart(2, '0'));
    }
    return '0x' + padded.join('');
};

const CpuState: FC<CpuStateProps> = (props) => {
    const opcode = sliceHex(props.instruction.machineCode, 0, 1);
    const regs = sliceHex(props.instruction.machineCode, 1, 2);
    const offset = sliceHex(props.instruction.machineCode, 2, 4);
    const k = sliceHex(props.instruction.machineCode, 4, 8);

    return (
        <Box>
            <Typography variant="h5" component="div">CPU State</Typography>
            <Grid container spacing={2}>
                <Grid item xs={3}>Instruction:</Grid>
                <Grid item xs={9}>Opcode: {opcode} Dst/Src: {regs} Offset: {offset} K: {k}</Grid>
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
