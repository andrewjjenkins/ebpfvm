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
import Typography from '@mui/material/Typography';
import HexEditor from './hex-editor';

interface MemoryProps {
    title: string,
    memory: Uint8Array,
    startingAddress?: number,
    numWordsToShow?: number,
    hotAddress?: number,
    timeStep?: number,
}

const Memory: FC<MemoryProps> = (props) => {
    const startingAddress = props.startingAddress || 0;
    //const hotAddress = props.hotAddress || 0;

    return (
        <Box>
            <Typography variant="h5" component="div">{props.title}</Typography>
            <HexEditor
                columns={0x10}
                rows={0x08}
                rowHeight={22}
                data={props.memory}
                memoryOffset={startingAddress}
                nonce={props.timeStep}
                showRowLabels={true}
                inlineStyles={{}}
            />
        </Box>
    )

}

export default Memory;
