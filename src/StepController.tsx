import { 
    FunctionComponent as FC,
} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Typography } from '@mui/material';

interface StepControllerProps {
    onReset(): void;
    onStep(): void;
    onPlay(): void;
    error: string | null;
}

const StepController: FC<StepControllerProps> = (props) => {
    const errorRendered = props.error ? (
        <Typography>{props.error}</Typography>
    ) : (
        <Typography>No Error</Typography>
    );
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
            >Step</Button>
            <Button
                variant="outlined"
                startIcon={<PlayArrowIcon />}
                onClick={props.onPlay}
            >Run</Button>
            {errorRendered}
        </Box>
    );
};

export default StepController;
