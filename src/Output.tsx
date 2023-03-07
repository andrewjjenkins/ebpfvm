import { FunctionComponent as FC } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const printkTextStyle = {
    fontFamily: 'Monospace',
    fontSize: 'default',
    margin: '1px',
};

const printkEmptyBoxStyle = {
    border: '2px solid grey',
    borderRadius: '5px',
    padding: '2lh',
    justifyContent: 'center',
    display: 'flex',
};

const printkBoxStyle = {
    border: '2px solid grey',
    borderRadius: '5px',
    minHeight: '5lh',
    padding: '4px',
    display: 'flex',
};

const programResultEmptyBoxStyle = {
    border: '2px solid grey',
    borderRadius: '5px',
    padding: '0.4lh',
    justifyContent: 'center',
    display: 'flex',
};

const programResultBoxStyle = {
    border: '2px solid grey',
    borderRadius: '5px',
    minHeight: '1lh',
    padding: '4px',
    display: 'flex',
};

interface PrintkProps {
    lines: string[],
}

const Printk: FC<PrintkProps> = (props) => {
    if (props.lines.length === 0) {
        return (
            <Box>
                <Typography variant="h6" component="div">bpf_trace_printk() output:</Typography>
                <Box sx={printkEmptyBoxStyle}>
                    <Typography sx={{ display: "flex", weight: "light", fontStyle: "italic" }}>Empty</Typography>
                </Box>
            </Box>
        );
    } else {
        return (
            <Box>
                <Typography variant="h6" component="div">bpf_trace_printk()</Typography>
                <Box sx={printkBoxStyle}>
                    {props.lines.map((line: string, index: number) => {
                            return (
                                <Typography sx={printkTextStyle} key={index}>{line}</Typography>
                            );
                    })}
                </Box>
            </Box>
        );

    }
};

interface LastErrorProps {
    lastError: string | null,
}

const LastError: FC<LastErrorProps> = (props) => {
    if (!props.lastError || props.lastError === "") {
        return (
            <Box>
                <Typography variant="h6" component="div">Program Result:</Typography>
                <Box sx={programResultEmptyBoxStyle}>
                    <Typography sx={{ display: "flex", weight: "light", fontStyle: "italic" }}>Empty</Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" component="div">Program Result</Typography>
            <Box sx={programResultBoxStyle}>
                <Typography sx={printkTextStyle}>{props.lastError}</Typography>
            </Box>
        </Box>
    );
};

interface OutputProps {
    title: string,
    printkLines: string[],
    lastError: string | null,
}

const Output: FC<OutputProps> = (props) => {
    return (
        <Box>
            <Typography variant="h5" component="div">{props.title}</Typography>
            <Printk lines={props.printkLines}/>
            <LastError lastError={props.lastError}/>
        </Box>
    )
};

export default Output;

