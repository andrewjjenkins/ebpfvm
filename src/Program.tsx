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
import { FunctionComponent as FC, useCallback, useState } from "react";
import { assemble, AssembledProgram } from "./vm/program";
import { Box, Button, Typography } from "@mui/material";
import {
    Edit as EditIcon,
    Build as BuildIcon,
    Pending as PendingIcon,
    Error as ErrorIcon,
    Cancel as CancelIcon,
} from "@mui/icons-material";
import { ProgramEditView } from "./ProgramEditor";
import { WindowedProgram } from "./WindowedProgram";

interface ProgramProps {
    programCounter: number;
    program: AssembledProgram;
    loadNewProgram: (p: AssembledProgram) => void;
}

const headerBoxStyle = {
    display: "flex",
    justifyContent: "space-between",
    ".MuiFormControlLabel-root > .MuiTypography-root": {
        fontSize: "0.8rem",
        fontWeight: "400",
    },
};

enum CodeState {
    Loaded = 0,
    Editing,
    Assembling,
    HasError,
}

const buildProgramSourceFromAssembled = (p: AssembledProgram) => {
    const sourceLines: string[] = [];
    for (let i = 0; i < p.instructions.length; i++) {
        sourceLines.push(p.instructions[i].asmSource);
    }
    return sourceLines.join("\n");
};

const Program: FC<ProgramProps> = (props) => {
    const [codeState, setCodeState] = useState<CodeState>(CodeState.Loaded);
    const [editedCodeSource, setEditedCodeSource] = useState<string>(
        buildProgramSourceFromAssembled(props.program)
    );
    const [lastError, setLastError] = useState<string>("");
    const [lastGoodSource, setLastGoodSource] = useState<string>("");
    const { loadNewProgram } = props;

    const onSourceChange = useCallback(
        (newValue: string) => {
            if (codeState === CodeState.HasError) {
                // Maybe the user fixed the error, remove the error alert.
                // We still leave the error in the error box.
                setCodeState(CodeState.Editing);
            }
            setEditedCodeSource(newValue);
        },
        [setEditedCodeSource, codeState, setCodeState]
    );

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
                    assembled = assemble(editedCodeSource.split("\n"), {});
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
    }, [
        codeState,
        setLastError,
        setCodeState,
        loadNewProgram,
        editedCodeSource,
    ]);

    const onClickCancel = useCallback(() => {
        if (
            codeState !== CodeState.Editing &&
            codeState !== CodeState.HasError
        ) {
            return;
        }
        setEditedCodeSource(lastGoodSource);
        setCodeState(CodeState.Loaded);
    }, [codeState, lastGoodSource, setCodeState, setEditedCodeSource]);

    let content: JSX.Element = <div></div>;
    if (codeState === CodeState.Loaded || codeState === CodeState.Assembling) {
        // User gets a read-only view.
        content = <WindowedProgram {...props}></WindowedProgram>;
    } else {
        content = (
            <ProgramEditView
                source={editedCodeSource}
                onChange={onSourceChange}
                lastError={lastError}
                {...props}
            />
        );
    }

    let buttons: JSX.Element[] = [];
    if (codeState === CodeState.Loaded) {
        buttons.push(
            <Button startIcon={<EditIcon />} onClick={onClickAction} key="edit">
                Edit
            </Button>
        );
    } else if (codeState === CodeState.Assembling) {
        buttons.push(
            <Button startIcon={<PendingIcon />} disabled={true} key="building">
                Building...
            </Button>
        );
    } else if (
        codeState === CodeState.Editing ||
        codeState === CodeState.HasError
    ) {
        if (codeState === CodeState.HasError) {
            // If the user just hit "build" and generated an error, and
            // hasn't changed any source yet, then the error definitely
            // still applies.  Put an error notice (as a disabled button)
            // right next to the "Build" button to encourage them to fix
            // the error before clicking "Build" again.
            buttons.push(
                <Button startIcon={<ErrorIcon />} disabled={true} key="error">
                    Error
                </Button>
            );
        }

        buttons.push(
            <Button
                startIcon={<CancelIcon />}
                onClick={onClickCancel}
                key="cancel"
            >
                Cancel
            </Button>
        );
        buttons.push(
            <Button
                startIcon={<BuildIcon />}
                onClick={onClickAction}
                key="building"
            >
                Build...
            </Button>
        );
    }

    return (
        <Box>
            <Box sx={headerBoxStyle}>
                <Typography variant="h5" component="div">
                    BPF Source Code
                </Typography>
                <Box>{buttons}</Box>
            </Box>
            {content}
        </Box>
    );
};

export default Program;
