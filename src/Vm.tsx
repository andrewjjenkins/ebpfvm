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
    useRef,
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
import Output from './Output';


interface VmProps {

}

// from https://stackoverflow.com/questions/53024496/state-not-updating-when-using-react-state-hook-within-setinterval/59274004#59274004
const useInterval = (callback: Function, delay: number | null) => {
    const intervalRef = useRef<number>();
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (typeof delay === 'number') {
        intervalRef.current = window.setInterval(() => callbackRef.current(), delay);

        // Clear interval if the components is unmounted or the delay changes:
        return () => window.clearInterval(intervalRef.current);
        }
    }, [delay]);

    return intervalRef;
};

const getStackPointer = (vmState: VmState): number => {
    const stackPointerBig = vmState.cpu.registers[10];
    if (stackPointerBig > BigInt("0xffffffff")) {
        throw new Error(`Stack pointer is too big: ${stackPointerBig}`);
    }
    const stackPointer = Number(stackPointerBig);
    return stackPointer;
};

const Vm: FC<VmProps> = (props) => {
    const [vmState, setVmState] = useState<VmState | null>(null);
    const [vmError, setVmError] = useState<string | null>(null);
    const [running, setRunning] = useState<boolean>(false);
    const [terminated, setTerminated] = useState<boolean>(false);
    const [printkLines, setPrintkLines] = useState<string[]>([]);
    const [hotAddress, setHotAddress] = useState<number>(0);

    // This is a hack to force React to consider state to have changed and then
    // re-render.  Necessary because vmState is not a well-behaved React state
    // variable following functional paradigms (we update it in-place rather
    // than cloning).
    const [timeStep, setTimeStep] = useState(0);

    useInterval(() => {
        if (vmState === null) {
            return;
        }
        const rc = vmState.step();
        const newHotAddress = Number(vmState.cpu.hotAddress[0]);
        if (newHotAddress !== 0) {
            setHotAddress(Number(vmState.cpu.hotAddress[0]));
        }
        if (rc < 0) {
            setVmError(`Error from VM: ${rc}`);
            setTerminated(true);
            setRunning(false);
        } else if (rc === 0) {
            setVmError(`Program Terminated`);
            setTerminated(true);
            setRunning(false);
        }
        setTimeStep(timeStep + 1);
    }, running ? 400 : null);

    const addPrintkLine = useCallback((line: string) => {
        let newLines: string[] = [...printkLines, line];
        if (newLines.length > 1024) {
            newLines = newLines.slice(newLines.length - 1024);
        }
        setPrintkLines(newLines);
    }, [printkLines, setPrintkLines]);

    useEffect(() => {
        newVm(addPrintkLine).then((vm: VmState) => {
            setVmState(vm);
            let hotAddress: number = Number(vm.cpu.hotAddress[0]);
            if (hotAddress === 0) {
                // Set it to the stack pointer, that is likely where
                // the first write will land, so this minimizes the
                // chances we jolt the screen early in the program.
                hotAddress = getStackPointer(vm);
            }
            setHotAddress(hotAddress);
        });
    }, []);

    if (vmState === null) {
        return (
            <Box>
                <Typography>VM initializing...</Typography>
            </Box>
        )
    }

    const onReset = () => {
        vmState.reset();
        setRunning(false);
        setPrintkLines([]);
        setVmError(null);
        setTerminated(false);
        setTimeStep(timeStep + 1);
    };
    const onStep = () => {
        if (terminated) { return; }
        setRunning(false);
        const rc = vmState.step();
        const newHotAddress = Number(vmState.cpu.hotAddress[0]);
        if (newHotAddress !== 0) {
            setHotAddress(Number(vmState.cpu.hotAddress[0]));
        }
        if (rc < 0) {
            setVmError(`Error from VM: ${rc}`);
            setTerminated(true);
        } else if (rc === 0) {
            setVmError(`Program Terminated`);
            setTerminated(true);
        }
        setTimeStep(timeStep + 1);
    };
    const onPlay = () => {
        if (terminated) { return; }
        setRunning(!running);
    }

    const onSetMemoryValue = (offset: number, value: number) => {
        vmState.stack.mem[offset] = value;
        setTimeStep(timeStep + 1);
    };

    const machineCode = new Uint8Array(
        vmState.program.instructions.buffer,
        vmState.program.instructions.byteOffset + (vmState.cpu.programCounter[0] * 8),
        8)
    const currentInstruction = {
        asmSource: "# foobar",
        machineCode: machineCode,
    };

    return (
        <Box>
        <Paper sx={{ maxWidth: 936, margin: 'auto', marginBottom: 2, padding: 2, overflow: 'hidden' }}>
            <Memory
                title="Stack"
                memory={vmState.stack.mem}
                numWordsToShow={16}
                startingAddress={vmState.stack.mem.byteOffset}
                hotAddress={hotAddress}
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
                onPlay={onPlay}
                running={running}
                terminated={terminated}
                error={vmError}
            />
        </Paper>
        <Paper sx={{ maxWidth: 936, margin: 'auto', marginBottom: 2, padding: 2, overflow: 'hidden' }}>
            <Output
                title={"Output"}
                printkLines={printkLines}
                lastError={vmError}
            />
        </Paper>
        </Box>
    );
};

export default Vm;
