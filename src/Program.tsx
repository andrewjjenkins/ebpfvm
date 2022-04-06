import { FunctionComponent as FC } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const style = {
    width: '100%',
    maxWidth: 400,
    bgcolor: 'background.paper',
    fontFamily: 'Monospace',
};

const defaultProgram = [
    '     ldh [12]',
    '     jeq #ETHERTYPE_IP, L1, L2',
    'L1:  ret #TRUE',
    'L2:  ret #0',
];

const codeStyle = {
    fontFamily: 'Monospace',
    margin: '1px',
};

interface ProgramProps {

}

const Program: FC<ProgramProps> = (props) => {
    return (
        <Box>
            <Typography variant="h5" component="div">BPF Source Code</Typography>
            <List sx={style} aria-label="program source">
                {defaultProgram.map((progLine => {
                    return (
                        <ListItem divider sx={{ padding: 0 }}>
                            <Typography component="pre" sx={codeStyle}>{progLine}</Typography>
                        </ListItem>
                    )
                }))
            }
            </List>
        </Box>
    );
};

export default Program;
