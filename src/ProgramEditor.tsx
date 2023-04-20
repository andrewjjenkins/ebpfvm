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
import CodeMirror from "@uiw/react-codemirror";
import { Box, Typography } from "@mui/material";

const errorBoxStyle = {
    border: "2px solid grey",
    borderRadius: "5px",
    minHeight: "1lh",
    padding: "4px",
    display: "flex",
};

const printkTextStyle = {
    fontFamily: "Monospace",
    fontSize: "default",
    margin: "1px",
    whiteSpace: "pre-line",
};

interface LastErrorProps {
    lastError: string | null;
}

const LastError: FC<LastErrorProps> = (props) => {
    if (!props.lastError || props.lastError === "") {
        return null;
    }

    return (
        <Box>
            <Typography variant="h6" component="div">
                Assembler Error
            </Typography>
            <Box sx={errorBoxStyle}>
                <Typography sx={printkTextStyle}>{props.lastError}</Typography>
            </Box>
        </Box>
    );
};

interface ProgramEditProps {
    source: string;
    onChange: (newValue: string) => void;
    lastError: string;
}

export const ProgramEditView: FC<ProgramEditProps> = (props) => {
    return (
        <Box>
            <CodeMirror value={props.source} onChange={props.onChange} />
            <LastError lastError={props.lastError} />
        </Box>
    );
};
