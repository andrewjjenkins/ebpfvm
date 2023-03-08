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
    useState,
    useEffect,
    useRef,
} from 'react';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import HexEditor from './hex-editor';

interface MemoryProps {
    title: string,
    memory: Uint8Array,
    startingAddress?: number,
    numWordsToShow?: number,
    hotAddress?: number,
    timeStep?: number,
    onSetValue?: (offset: number, value: number) => void;
}

const headerBoxStyle = {
    display: "flex",
    justifyContent: "space-between",
    ".MuiFormControlLabel-root > .MuiTypography-root": {
        fontSize: '0.8rem',
        fontWeight: '400',
    },
};

const ROWS_TO_SHOW = 8;

const Memory: FC<MemoryProps> = (props) => {
    const [hotAddress, setHotAddress] = useState<number>(0);
    const [autofocus, setAutofocus] = useState(true);
    const [showAscii, setShowAscii] = useState(true);
    const hexEditor = useRef<any>(null);

    const startingAddress = props.startingAddress || 0;
    const newHotAddress = props.hotAddress || 0;
    useEffect(() => {
        if (newHotAddress !== hotAddress) {
            setHotAddress(newHotAddress);
            if (hexEditor.current !== null && autofocus) {
                hexEditor.current.scrollToByte(newHotAddress - startingAddress);
            }
        }
    }, [newHotAddress, hotAddress, autofocus, startingAddress]);

    const onAutofocusToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAutofocus(event.target.checked);
    };
    const onShowAsciiToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setShowAscii(event.target.checked);
    };


    return (
        <Box>
            <Box sx={headerBoxStyle}>
                <Typography variant="h5" component="div">{props.title}</Typography>
                <Box>
                    <FormControlLabel label={"Autofocus"} control={
                        <Checkbox size="small" checked={autofocus} onChange={onAutofocusToggle}/>
                    }/>
                    <FormControlLabel label={"ASCII"} control={
                        <Checkbox size="small" checked={showAscii} onChange={onShowAsciiToggle}/>
                    }/>
                </Box>
            </Box>
            <HexEditor
                ref={hexEditor}
                rows={ROWS_TO_SHOW}
                columnLinebreakInterval={8}
                rowHeight={22}
                data={props.memory}
                showAscii={showAscii}
                memoryOffset={startingAddress}
                nonce={props.timeStep}
                showRowLabels={true}
                inlineStyles={{}}
                onSetValue={props.onSetValue}
            />
        </Box>
    )

}

export default Memory;
