/*
 * Copyright 2023 Andrew Jenkins <andrewjjenkins@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { 
    FunctionComponent as FC,
} from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Instruction } from './vm/program';

interface CpuStateProps {
    instruction: Instruction | null;
    programCounter: number;
    registers: BigUint64Array;
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

const stateItemStyle = {
    padding: '1px',
};

const stateInnerItemStyle = {
   flexWrap: 'nowrap',
   justifyContent: 'center',
   alignItems: 'center',
   display: 'flex',
   margin: '1px',
   border: '2px solid grey',
   borderRadius: '5px',
};

const codeStyle = {
    fontFamily: 'Monospace',
    margin: '1px',
};

const renderStateItem = (label: string, value: string) => {
    return (
        <Grid item xs={12} sm={6} key={label} sx={stateItemStyle}>
            <Box sx={stateInnerItemStyle}>
                <Typography sx={{minWidth: '3em'}}>{label}</Typography>{ }
                <Typography component="pre" sx={codeStyle}>{value}</Typography>
            </Box>
        </Grid>
    );
};

const CpuState: FC<CpuStateProps> = (props) => {
    const registerGridItems: JSX.Element[] = [];
    for (let i = 0; i < 11; i++) {
        const regVal = props.registers[i].toString(16).padStart(16, '0');
        registerGridItems.push(renderStateItem(`r${i}:`, `0x${regVal}`));
    }

    if (props.instruction === null) {
        return (
            <Box>
                <Typography variant="h5" component="div">CPU State</Typography>
                <Grid container spacing={0.5} sx={{padding: '10px'}}>
                    {renderStateItem("Opcode:", " -")}
                    {renderStateItem("Dst/Src:", " -")}
                    {renderStateItem("Offset:", " -")}
                    {renderStateItem("K:", " -")}
                    {registerGridItems}
                    {renderStateItem("Program Counter:", `${props.programCounter}`)}
                </Grid>
            </Box>
        );
    }

    const opcode = sliceHex(props.instruction.machineCode, 0, 1);
    const regs = sliceHex(props.instruction.machineCode, 1, 2);
    const offset = sliceHex(props.instruction.machineCode, 2, 4);
    const k = sliceHex(props.instruction.machineCode, 4, 8);

    return (
        <Box>
            <Typography variant="h5" component="div">CPU State</Typography>
            <Grid container spacing={0.5} sx={{padding: '10px'}}>
                {renderStateItem("Opcode:", opcode)}
                {renderStateItem("Dst/Src:", regs)}
                {renderStateItem("Offset:", offset)}
                {renderStateItem("K:", k)}
                {registerGridItems}
                {renderStateItem("Program Counter:", `${props.programCounter}`)}
            </Grid>
        </Box>
    );
};

export default CpuState;
