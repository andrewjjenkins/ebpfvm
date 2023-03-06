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
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { disassemble } from './vm/instructions';
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
    instructions: Uint8Array;
}

const Program: FC<ProgramProps> = (props) => {
    const numInstructions = props.instructions.length / 8;

    const disassembled = disassemble(props.instructions, 0, numInstructions);

    const rows: JSX.Element[] = [];

    for (let i = 0; i < numInstructions; i++) {
        const addr = i*8;
        const active = (props.programCounter * 8 === addr);
        const offset = props.instructions.byteOffset + addr;
        const instView = new Uint8Array(props.instructions.buffer, offset, 8);
        let inst = "";
        for (let j = 0; j < 8; j++) {
            inst += instView[j].toString(16).padStart(2, "0");
        }

        rows.push((
            <TableRow key={addr} selected={active}>
                <TableCell align="left" sx={{ py: 0, px: 0.5 }}>
                    <Typography component="pre" sx={codeStyle}>{disassembled[i]}</Typography>
                </TableCell>
                <TableCell align="left" sx={{ py: 0, px: 0.5}}>
                    <Typography component="pre" sx={codeStyle}>{inst}</Typography>
                </TableCell>
            </TableRow>
        ));
    }


    return (
        <Box>
            <Typography variant="h5" component="div">BPF Source Code</Typography>
            <TableContainer sx={{width: "50%"}}>
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
