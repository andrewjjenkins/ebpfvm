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
import { FunctionComponent as FC } from 'react';
import { Instruction } from './vm/program';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { TableContainer, TableRow, TableCell, TableBody, Table } from '@mui/material';

const style = {
    minWidth: 180,
    bgcolor: 'background.paper',
};

const codeStyle = {
    fontFamily: 'Monospace',
    margin: '1px',
};

interface ProgramProps {
    programCounter: number;
    instructions: Instruction[];
}

const Program: FC<ProgramProps> = (props) => {
    const numInstructions = props.instructions.length;

    const rows: JSX.Element[] = [];

    let addr = 0;

    for (let i = 0; i < numInstructions; i++) {
        let active = (props.programCounter * 8 === addr);
        let inst = "";
        for (let j = 0; j < props.instructions[i].machineCode.byteLength; j++) {
            if (j === 8) {
                inst += '\n';
            }
            inst += props.instructions[i].machineCode[j].toString(16).padStart(2, "0");
        }

        rows.push((
            <TableRow key={addr} selected={active}>
                <TableCell align="left" sx={{ py: 0, px: 0.5 }}>
                    <Typography component="pre" sx={codeStyle}>{props.instructions[i].asmSource}</Typography>
                </TableCell>
                <TableCell align="left" sx={{ py: 0, px: 0.5}}>
                    <Typography component="pre" sx={codeStyle}>{inst}</Typography>
                </TableCell>
            </TableRow>
        ));

        addr += props.instructions[i].machineCode.byteLength;
    }


    return (
        <Box>
            <Typography variant="h5" component="div">BPF Source Code</Typography>
            <TableContainer sx={{width: "100%"}}>
                <Table sx={{style}} size="medium" aria-label="Instructions">
                    <TableBody>
                        {rows}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Program;
