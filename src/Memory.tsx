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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import HexEditor from './hex-editor';

export interface HotAddressInfo {
    address: number;
    size: number;  // size=0: we'll scroll but not highlight.
}

interface MemoryProps {
    title: string,
    memory: Uint8Array,
    startingAddress?: number,
    numWordsToShow?: number,
    hotAddress?: HotAddressInfo,
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
    const [hotByte, setHotByte] = useState<number>(0);
    const [autofocus, setAutofocus] = useState(true);
    const [showAscii, setShowAscii] = useState(true);
    const hexEditor = useRef<any>(null);

    const startingAddress = props.startingAddress || 0;
    useEffect(() => {
        const newHotAddress = props.hotAddress || {address: 0, size: 0};
        const newHotByte = newHotAddress.address - startingAddress;
        if (newHotByte < 0 || newHotByte > props.memory.byteLength) {
            // This hot byte is not in our view; remain how we are.
            return;
        }
        setHotByte(newHotByte);
        if (hexEditor.current !== null && autofocus) {
            hexEditor.current.scrollToByte(newHotByte);
            if (newHotAddress.size !== 0) {
                hexEditor.current.setSelectionRange(newHotByte, newHotByte + newHotAddress.size);
            }
        }
    }, [props.hotAddress, hotByte, autofocus, startingAddress, props.memory.byteLength]);

    const onAutofocusToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAutofocus(event.target.checked);
    };
    const onShowAsciiToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setShowAscii(event.target.checked);
    };
    const autofocusTooltip = "Automatically scroll to the last read/written address";
    const asciiTooltip = "Also show ASCII representation";

    return (
        <Box>
            <Box sx={headerBoxStyle}>
                <Typography variant="h5" component="div">{props.title}</Typography>
                <Box>
                    <Tooltip title={autofocusTooltip}>
                        <FormControlLabel label={"Autofocus"} control={
                            <Checkbox size="small" checked={autofocus} onChange={onAutofocusToggle}/>
                        }/>
                    </Tooltip>
                    <Tooltip title={asciiTooltip}>
                        <FormControlLabel label={"ASCII"} control={
                            <Checkbox size="small" checked={showAscii} onChange={onShowAsciiToggle}/>
                        }/>
                    </Tooltip>
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
                showColumnLabels={true}
                showRowLabels={true}
                inlineStyles={{}}
                onSetValue={props.onSetValue}
            />
        </Box>
    )

}

export default Memory;
