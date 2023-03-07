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
    useEffect,
    useState,
    useCallback,
} from 'react';
import Box from '@mui/material/Box';
import { 
    newVm,
    Vm as VmState,
} from './vm/vm';
import Memory from './Memory';
import Program from './Program';
import CpuState from './CpuState';
import StepController from './StepController';
import Paper from '@mui/material/Paper';
import { Typography } from '@mui/material';


interface VmProps {

}

const Vm: FC<VmProps> = (props) => {
    const [vmState, setVmState] = useState<VmState | null>(null);
    const [vmError, setVmError] = useState<string | null>(null);
    const [printkLines, setPrintkLines] = useState<string[]>([]);

    // This is a hack to force React to consider state to have changed and then
    // re-render.  Necessary because vmState is not a well-behaved React state
    // variable following functional paradigms (we update it in-place rather
    // than cloning).
    const [timeStep, setTimeStep] = useState(0);

    const addPrintkLine = useCallback((line: string) => {
        let newLines: string[] = [...printkLines, line];
        if (newLines.length > 1024) {
            newLines = newLines.slice(newLines.length - 1024);
        }
        setPrintkLines(newLines);
    }, [printkLines, setPrintkLines]);

    useEffect(() => {
        newVm(addPrintkLine).then((vm: VmState) => {setVmState(vm)});
    }, []);

    if (vmState === null) {
        return (
            <Box>
                <Typography>VM initializing...</Typography>
            </Box>
        )
    }

    const onReset = () => {
        vmState.cpu.programCounter[0] = 0;
        setPrintkLines([]);
        setVmError(null);
        setTimeStep(timeStep + 1);
    };
    const onStep = () => {
        const rc = vmState.step();
        if (rc < 0) {
            setVmError(`Error from VM: ${rc}`);
        } else if (rc === 0) {
            setVmError(`Program Terminated`);
        }
        setTimeStep(timeStep + 1);
    };

    const onSetMemoryValue = (offset: number, value: number) => {
        vmState.stack.mem[offset] = value;
        setTimeStep(timeStep + 1);
    };

    // FIXME
    // const instructionIndex = vmState.cpu.instructionPointer / 8;
    //const currentInstruction = vmState.program.instructions[instructionIndex];
    const machineCode = new Uint8Array(
        vmState.program.instructions.buffer,
        vmState.program.instructions.byteOffset + (vmState.cpu.programCounter[0] * 8),
        8)
    const currentInstruction = {
        asmSource: "# foobar",
        machineCode: machineCode,
    };

    const stackPointerBig = vmState.cpu.registers[10];
    if (stackPointerBig > BigInt("0xffffffff")) {
        throw new Error(`Stack pointer is too big: ${stackPointerBig}`);
    }
    const stackPointer = Number(stackPointerBig);

    return (
        <Box>
        <Paper sx={{ maxWidth: 936, margin: 'auto', marginBottom: 2, padding: 2, overflow: 'hidden' }}>
            <Memory
                title="Stack"
                memory={vmState.stack.mem}
                numWordsToShow={16}
                startingAddress={vmState.stack.mem.byteOffset}
                hotAddress={stackPointer}
                timeStep={timeStep}
                onSetValue={onSetMemoryValue}
            />
        </Paper>
        <Paper sx={{ maxWidth: 936, margin: 'auto', marginBottom: 2, padding: 2, overflow: 'hidden' }}>
            <Program 
                programCounter={vmState.cpu.programCounter[0]}
                instructions={vmState.program.instructions}
            />
        </Paper>
        <Paper sx={{ maxWidth: 936, margin: 'auto', marginBottom: 2, padding: 2, overflow: 'hidden' }}>
            <CpuState 
                instruction={currentInstruction}
                programCounter={vmState.cpu.programCounter[0]}
                registers={vmState.cpu.registers}
                timeStep={timeStep}
            />
            <StepController 
                onReset={onReset}
                onStep={onStep}
                error={vmError}
                onPlay={() => {console.log('play');}}
            />
        </Paper>
        </Box>
    );
};

export default Vm;
