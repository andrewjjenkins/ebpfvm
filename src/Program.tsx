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
import { FunctionComponent as FC, useCallback, useState } from 'react';
import { assemble, AssembledProgram, Instruction } from './vm/program';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import BuildIcon from '@mui/icons-material/Build';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import CancelIcon from '@mui/icons-material/Cancel';
import { TableContainer, TableRow, TableCell, TableBody, Table, Button } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';

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
    program: AssembledProgram;
    loadNewProgram: (p: AssembledProgram) => void;
}

const headerBoxStyle = {
    display: "flex",
    justifyContent: "space-between",
    ".MuiFormControlLabel-root > .MuiTypography-root": {
        fontSize: '0.8rem',
        fontWeight: '400',
    },
};

enum CodeState {
    Loaded = 0,
    Editing,
    Assembling,
    HasError,
}

// If the first line of the program is a comment that contains
// annotations, extract them.
export const getAnnotations = (instructions: Instruction[]) => {
    if (instructions.length === 0 || instructions[0].asmSource.slice(0, 2) !== "//") {
        return {};
    }

    const annotations: {[annotation: string]: string} = {};
    let firstLine = instructions[0].asmSource.split('\n')[0].slice(2).trim();
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

const ProgramReadOnlyView: FC<ProgramProps> = (props) => {
    const instructions = props.program.instructions;
    const numInstructions = instructions.length;
    const annotations = getAnnotations(instructions);

    const rows: JSX.Element[] = [];

    let addr = 0;

    for (let i = 0; i < numInstructions; i++) {
        let active = (props.programCounter * 8 === addr);
        let inst = "";
        for (let j = 0; j < instructions[i].machineCode.byteLength; j++) {
            if (j === 8) {
                inst += '\n';
            }
            inst += instructions[i].machineCode[j].toString(16).padStart(2, "0");
        }

        // If the first line is annotations, we hide it in this view.
        let source = instructions[i].asmSource;
        if (i === 0 && Object.keys(annotations).length !== 0) {
            source = source.split('\n').slice(1).join('\n');
        }

        rows.push((
            <TableRow key={addr} selected={active}>
                <TableCell align="left" sx={{ py: 0, px: 0.5, verticalAlign: "bottom" }}>
                    <Typography component="pre" sx={codeStyle}>{source}</Typography>
                </TableCell>
                <TableCell align="left" sx={{ py: 0, px: 0.5, verticalAlign: "bottom"}}>
                    <Typography component="pre" sx={codeStyle}>{inst}</Typography>
                </TableCell>
            </TableRow>
        ));

        addr += instructions[i].machineCode.byteLength;
    }

    return (
        <Box>
            { annotations.entryPoint &&
                <Typography variant="subtitle1">Runs on <strong>{annotations.entryPoint}</strong>:</Typography>
            }
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

interface LastErrorProps {
    lastError: string | null,
}

const errorBoxStyle = {
    border: '2px solid grey',
    borderRadius: '5px',
    minHeight: '1lh',
    padding: '4px',
    display: 'flex',
};

const printkTextStyle = {
    fontFamily: 'Monospace',
    fontSize: 'default',
    margin: '1px',
    whiteSpace: 'pre-line',
};

const LastError: FC<LastErrorProps> = (props) => {
    if (!props.lastError || props.lastError === "") {
        return null;
    }

    return (
        <Box>
            <Typography variant="h6" component="div">Assembler Error</Typography>
            <Box sx={errorBoxStyle}>
                <Typography sx={printkTextStyle}>{props.lastError}</Typography>
            </Box>
        </Box>
    );
};


interface ProgramEditProps extends ProgramProps {
    source: string;
    onChange: (newValue: string) => void;
    lastError: string;
}

const ProgramEditView: FC<ProgramEditProps> = (props) => {
    return (
        <Box>
            <CodeMirror value={props.source} onChange={props.onChange}/>
            <LastError lastError={props.lastError} />
        </Box>
    );
};

const buildProgramSourceFromAssembled = (p: AssembledProgram) => {
    const sourceLines: string[] = [];
    for (let i = 0; i < p.instructions.length; i++) {
        sourceLines.push(p.instructions[i].asmSource);
    }
    return sourceLines.join('\n');
};

const Program: FC<ProgramProps> = (props) => {
    const [codeState, setCodeState] = useState<CodeState>(CodeState.Loaded);
    const [editedCodeSource, setEditedCodeSource] =
        useState<string>(buildProgramSourceFromAssembled(props.program));
    const [lastError, setLastError] = useState<string>("");
    const [lastGoodSource, setLastGoodSource] = useState<string>("");
    const { loadNewProgram } = props;

    const onSourceChange = useCallback((newValue: string) => {
        if (codeState === CodeState.HasError) {
            // Maybe the user fixed the error, remove the error alert.
            // We still leave the error in the error box.
            setCodeState(CodeState.Editing);
        }
        setEditedCodeSource(newValue);
    }, [setEditedCodeSource, codeState, setCodeState]);

    const onClickAction = useCallback(() => {
        switch (codeState) {
            case CodeState.Loaded:
                setLastGoodSource(editedCodeSource);
                setCodeState(CodeState.Editing);
                break;

            case CodeState.HasError:
            case CodeState.Editing:
                setCodeState(CodeState.Assembling);
                let assembled: AssembledProgram | undefined = undefined;
                try {
                    assembled = assemble(editedCodeSource.split('\n'), {});
                } catch (error) {
                    if (error instanceof Error) {
                        setLastError(error.toString());
                    } else {
                        setLastError("Unknown error assembling");
                    }
                    setCodeState(CodeState.HasError);
                    break;
                }
                loadNewProgram(assembled);
                setLastError("");
                setCodeState(CodeState.Loaded);
                break;

            case CodeState.Assembling:
                // Ignore... the user can't do anything until assembling is complete.
                break;
        }
    }, [codeState, setLastError, setCodeState, loadNewProgram, editedCodeSource]);

    const onClickCancel = useCallback(() => {
        if (codeState !== CodeState.Editing && codeState !== CodeState.HasError) {
            return;
        }
        setEditedCodeSource(lastGoodSource);
        setCodeState(CodeState.Loaded);
    }, [codeState, lastGoodSource, setCodeState, setEditedCodeSource]);

    let content: JSX.Element = (<div></div>);
    if (codeState === CodeState.Loaded || codeState === CodeState.Assembling) {
        // User gets a read-only view.
        content = (<ProgramReadOnlyView {...props}></ProgramReadOnlyView>);
    } else {
        content = (
            <ProgramEditView
                source={editedCodeSource}
                onChange={onSourceChange}
                lastError={lastError}
                {...props}/>
        );
    }

    let buttons: JSX.Element[] = [];
    if (codeState === CodeState.Loaded) {
        buttons.push((
            <Button startIcon={<EditIcon />} onClick={onClickAction} key="edit">
                Edit
            </Button>
        ));
    } else if (codeState === CodeState.Assembling) {
        buttons.push((
            <Button startIcon={<PendingIcon />} disabled={true} key="building">
                Building...
            </Button>
        ));
    } else if (codeState === CodeState.Editing || codeState === CodeState.HasError) {
        if (codeState === CodeState.HasError) {
            // If the user just hit "build" and generated an error, and
            // hasn't changed any source yet, then the error definitely
            // still applies.  Put an error notice (as a disabled button)
            // right next to the "Build" button to encourage them to fix
            // the error before clicking "Build" again.
            buttons.push((
                <Button startIcon={<ErrorIcon />} disabled={true} key="error">
                    Error
                </Button>
            ));
        }

        buttons.push((
            <Button startIcon={<CancelIcon />} onClick={onClickCancel} key="cancel">
                Cancel
            </Button>
        ));
        buttons.push((
            <Button startIcon={<BuildIcon />} onClick={onClickAction} key="building">
                Build...
            </Button>
        ));
    }

    return (
        <Box>
            <Box sx={headerBoxStyle}>
                <Typography variant="h5" component="div">BPF Source Code</Typography>
                <Box>
                    {buttons}
                </Box>
            </Box>
            {content}
        </Box>
    );
};

export default Program;
