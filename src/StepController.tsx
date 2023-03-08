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
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

interface StepControllerProps {
    onReset(): void;
    onStep(): void;
    onPlay(): void;
    running: boolean;
    terminated: boolean;
    error: string | null;
}

const StepController: FC<StepControllerProps> = (props) => {
    const playVariant = props.running ? "contained" : "outlined";
    const playIcon = props.running ? (<PauseIcon />) : (<PlayArrowIcon />);
    const playingDisabled = props.terminated;

    return (
        <Box>
            <Button
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={props.onReset}
            >Reset</Button>
            <Button
                variant="outlined"
                startIcon={<ArrowForwardIcon />}
                onClick={props.onStep}
                disabled={playingDisabled}
            >Step</Button>
            <Button
                variant={playVariant}
                startIcon={playIcon}
                onClick={props.onPlay}
                disabled={playingDisabled}
            >Run</Button>
        </Box>
    );
};

export default StepController;
