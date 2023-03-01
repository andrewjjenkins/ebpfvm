import { 
    FunctionComponent as FC,
} from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Instruction } from './vm/program';

interface CpuStateProps {
    instruction: Instruction;
    programCounter: number;
    registers: BigInt64Array;
    timeStep?: number,
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

    const registerGridItems: JSX.Element[] = [];
    for (let i = 0; i < 11; i++) {
        registerGridItems.push((<Grid item xs={3} key={`r${i}_hdr`}>r{i}:</Grid>));
        const regVal = props.registers[i].toString(16).padStart(16, '0');
        registerGridItems.push((<Grid item xs={9} key={`r${i}`}>0x{regVal}</Grid>));
    }

    return (
        <Box>
            <Typography variant="h5" component="div">CPU State</Typography>
            <Grid container spacing={2}>
                <Grid item xs={3} key="inst_hdr">Instruction:</Grid>
                <Grid item xs={9} key="inst">Opcode: {opcode} Dst/Src: {regs} Offset: {offset} K: {k}</Grid>
                <Grid item xs={3} key="pc_hdr">Program Counter:</Grid>
                <Grid item xs={9} key="pc">{props.programCounter}</Grid>
                {registerGridItems}
            </Grid>
        </Box>
    );
};

export default CpuState;
