import { FunctionComponent as FC } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { DEFAULT_PROGRAM } from './vm/consts';

const style = {
    width: '100%',
    maxWidth: 400,
    bgcolor: 'background.paper',
    fontFamily: 'Monospace',
};

const codeStyle = {
    fontFamily: 'Monospace',
    margin: '1px',
};

interface ProgramProps {
    instructionPointer: number;
}

const Program: FC<ProgramProps> = (props) => {
    return (
        <Box>
            <Typography variant="h5" component="div">BPF Source Code</Typography>
            <List sx={style} aria-label="program source">
                {DEFAULT_PROGRAM.map((progLine, i) => {
                    const addr = i*8;
                    const active = (props.instructionPointer === addr);
                    return (
                        <ListItem selected={active} divider sx={{ padding: 0 }} key={addr}>
                            <Typography component="pre" sx={codeStyle}>{progLine}</Typography>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );
};

export default Program;
