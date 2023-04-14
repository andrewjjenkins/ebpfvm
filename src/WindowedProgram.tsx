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
import { FunctionComponent as FC } from "react";
import {
    TableContainer,
    TableRow,
    TableCell,
    TableBody,
    Table,
    Box,
    Typography,
} from "@mui/material";
import { AssembledProgram, Instruction } from "./vm/program";

const style = {
    minWidth: 180,
    bgcolor: "background.paper",
};

const codeStyle = {
    fontFamily: "Monospace",
    margin: "1px",
};

// If the first line of the program is a comment that contains
// annotations, extract them.
export const getAnnotations = (instructions: Instruction[]) => {
    if (
        instructions.length === 0 ||
        instructions[0].asmSource.slice(0, 2) !== "//"
    ) {
        return {};
    }

    const annotations: { [annotation: string]: string } = {};
    let firstLine = instructions[0].asmSource.split("\n")[0].slice(2).trim();
    while (firstLine !== "") {
        const matches = /^(\S+): ?(\S+)/.exec(firstLine);
        if (matches === null) {
            // The format of this line is invalid.
            return {};
        }
        annotations[matches[1]] = matches[2];

        // Chop off this match and any whitespace.
        firstLine = firstLine.slice(matches[0].length).trimStart();
    }
    return annotations;
};

interface WindowedProgramProps {
    programCounter: number;
    program: AssembledProgram;
}

export const WindowedProgram: FC<WindowedProgramProps> = (props) => {
    const instructions = props.program.instructions;
    const numInstructions = instructions.length;
    const annotations = getAnnotations(instructions);

    const rows: JSX.Element[] = [];

    let addr = 0;

    for (let i = 0; i < numInstructions; i++) {
        let active = props.programCounter * 8 === addr;
        let inst = "";
        for (let j = 0; j < instructions[i].machineCode.byteLength; j++) {
            if (j === 8) {
                inst += "\n";
            }
            inst += instructions[i].machineCode[j]
                .toString(16)
                .padStart(2, "0");
        }

        // If the first line is annotations, we hide it in this view.
        let source = instructions[i].asmSource;
        if (i === 0 && Object.keys(annotations).length !== 0) {
            source = source.split("\n").slice(1).join("\n");
        }

        rows.push(
            <TableRow key={addr} selected={active}>
                <TableCell
                    align="left"
                    sx={{ py: 0, px: 0.5, verticalAlign: "bottom" }}
                >
                    <Typography component="pre" sx={codeStyle}>
                        {source}
                    </Typography>
                </TableCell>
                <TableCell
                    align="left"
                    sx={{ py: 0, px: 0.5, verticalAlign: "bottom" }}
                >
                    <Typography component="pre" sx={codeStyle}>
                        {inst}
                    </Typography>
                </TableCell>
            </TableRow>
        );

        addr += instructions[i].machineCode.byteLength;
    }

    return (
        <Box>
            {annotations.entryPoint && (
                <Typography variant="subtitle1">
                    Runs on <strong>{annotations.entryPoint}</strong>:
                </Typography>
            )}
            <TableContainer sx={{ width: "100%" }}>
                <Table sx={{ style }} size="medium" aria-label="Instructions">
                    <TableBody>{rows}</TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
