import {
    FunctionComponent as FC,
    useState,
} from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';

interface MemoryProps {
    memory: Uint8Array,
    numWordsToShow?: number,
}

const DEFAULT_NUM_WORDS_TO_SHOW = 8;

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

const min = (a: number, b: number) => (a < b) ? a : b;

const Memory: FC<MemoryProps> = (props) => {
    const [hotAddress] = useState(0);
    
    // FIXME: hotAddress should probably be rounded to hotWordAddress?

    const numWords: number = props.numWordsToShow || DEFAULT_NUM_WORDS_TO_SHOW;
    const halfNumWords = Math.ceil(numWords / 2);

    const showTop = (numWords * 4 > hotAddress);
    const showBottom = (numWords * 4 + hotAddress > props.memory.byteLength);

    // FIXME: If we're trying to highlight one of the last words in memory
    // we don't show enough words (we only show "half" the words - those that
    // come before).
    const firstWordAddr = showTop ? 0 : hotAddress - (halfNumWords * 4);
    const lastWordAddr = min(firstWordAddr + (numWords * 4), props.memory.byteLength);

    const renderedWord = (addr: number) => {
        let memLine = `0x${addr.toString(16).padStart(8, '0')}: `;
        const stop = min(addr + 4, props.memory.byteLength);
        for (let i = addr; i < stop; i++) {
            memLine += ` ${props.memory[i].toString(16).padStart(2, '0')}`;
        }
        return (
            <ListItem divider sx={{ padding: 0 }} key={addr}>
                <Typography component="pre" sx={codeStyle}>{memLine}</Typography>
            </ListItem>
        );
    };

    let rows: JSX.Element[] = [];
    for (let i = firstWordAddr; i < lastWordAddr; i += 4) {
        rows.push(renderedWord(i));
    }

    return (
        <Box>
            <Typography variant="h5" component="div">Memory</Typography>
            <List sx={style} aria-label="memory">
                { showTop ? null : (
                    <ListItem key="showTop">
                        <Typography component="pre" sx={codeStyle}>...</Typography>
                    </ListItem>
                )}
                {rows}
                { showBottom ? null : (
                    <ListItem key="showBottom">
                        <Typography component="pre" sx={codeStyle}>...</Typography>
                    </ListItem>
                )}

            </List>
        </Box>
    )

}

export default Memory;
