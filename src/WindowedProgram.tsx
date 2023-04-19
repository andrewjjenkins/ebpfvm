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
import { FunctionComponent as FC, createContext, useContext } from "react";
import {
    TableContainer,
    TableRow,
    TableCell,
    TableBody,
    Table,
    Box,
    Typography,
} from "@mui/material";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
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

export interface WindowedProgramContextInterface {
    programCounter: number;
    program: AssembledProgram;
    annotations: {[annotation: string]: string};
}

const WindowedProgramContext = createContext<WindowedProgramContextInterface>({
    programCounter: 0,
    program: { labels: {}, instructions: [] },
    annotations: {},
});

const ProgramLine = ({index: rowIndex, style: itemStyle}: ListChildComponentProps) => {
    const { programCounter, program, annotations } = useContext(WindowedProgramContext);
    const addr = 8 * rowIndex;
    const active = programCounter * 8 === addr;
    const { instructions } = program;

    let inst = "";
    for (let j = 0; j < instructions[rowIndex].machineCode.byteLength; j++) {
        if (j === 8) {
            inst += "\n";
        }
        inst += instructions[rowIndex].machineCode[j]
            .toString(16)
            .padStart(2, "0");
    }

    // If the first line is annotations, we hide it in this view.
    let source = instructions[rowIndex].asmSource;
    if (rowIndex === 0 && Object.keys(annotations).length !== 0) {
        source = source.split("\n").slice(1).join("\n");
    }

    return (
        <Box>
            <Box
                sx={{ py: 0, px: 0.5, verticalAlign: "bottom" }}
            >
                <Typography component="pre" sx={codeStyle}>
                    {source}
                </Typography>
            </Box>
            <Box
                sx={{ py: 0, px: 0.5, verticalAlign: "bottom" }}
            >
                <Typography component="pre" sx={codeStyle}>
                    {inst}
                </Typography>
            </Box>
        </Box>
    );
};

interface WindowedProgramProps {
    programCounter: number;
    program: AssembledProgram;
}

export const WindowedProgram: FC<WindowedProgramProps> = (props) => {
    const instructions = props.program.instructions;
    const numInstructions = instructions.length;
    const annotations = getAnnotations(instructions);

    const windowedContext = {
        programCounter: props.programCounter,
        program: props.program,
        annotations,
    };

    return (
        <Box>
            {annotations.entryPoint && (
                <Typography variant="subtitle1">
                    Runs on <strong>{annotations.entryPoint}</strong>:
                </Typography>
            )}
            <WindowedProgramContext.Provider value={windowedContext}>
                <List
                itemCount={10}
                itemSize={24}
                layout="vertical"
                height={150}
                width="100%"
                >
                    {ProgramLine}
                </List>
            </WindowedProgramContext.Provider>
        </Box>
    );
};
