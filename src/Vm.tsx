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
    NewVmOptions,
    Vm as VmState,
} from './vm/vm';
import Memory, { HotAddressInfo } from './Memory';
import Program from './Program';
import CpuState from './CpuState';
import StepController from './StepController';
import Paper from '@mui/material/Paper';
import { Typography } from '@mui/material';
import Output from './Output';
import { BIG_MAX_32, HELLOWORLD_SOURCE } from './vm/consts';
import { AssembledProgram, assemble } from './vm/program';
import { CreateSchedCloneEntrypoint } from './vm/entrypoint';
import callbacks from './vm/calls';

interface VmInitializerProps {}

const VmInitializer: FC<VmInitializerProps> = (props) =>{
    const [printkLines, setPrintkLines] = useState<string[]>([]);
    const addPrintkLine = useCallback((line: string) => {
        let newLines: string[] = [...printkLines, line];
        if (newLines.length > 1024) {
            newLines = newLines.slice(newLines.length - 1024);
        }
        setPrintkLines(newLines);
    }, [printkLines, setPrintkLines]);

    const [vmState, setVmState] = useState<VmState | null>(() => {
        // Initialize the VM once (asynchronously)
        const vmOptions: NewVmOptions = {
            printkCallback: addPrintkLine,
            callbacks: callbacks,
        };
        newVm(vmOptions).then((vm: VmState) => {
            setVmState(vm);
        });

        // While we're waiting for the async call to complete,
        // init vmState to null
        return null;
    });

    if (vmState === null) {
        return (
            <Box>
                <Typography>VM initializing...</Typography>
            </Box>
        )
    }

    return (
        <Vm
        vmState={vmState}
        printkLines={printkLines}
        setPrintkLines={setPrintkLines}
        />
    );
};

interface VmProps {
    vmState: VmState;
    printkLines: string[];
    setPrintkLines: (lines: string[]) => void;
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
    if (stackPointerBig > BIG_MAX_32) {
        throw new Error(`Stack pointer is too big: ${stackPointerBig}`);
    }
    const stackPointer = Number(stackPointerBig);
    return stackPointer;
};

const Vm: FC<VmProps> = (props) => {
    const [vmError, setVmError] = useState<string | null>(null);
    const [running, setRunning] = useState<boolean>(false);
    const [terminated, setTerminated] = useState<boolean>(false);
    const [hotAddress, setHotAddress] = useState<HotAddressInfo>({address: 0, size: 0});

    // Do not call setProgram directly; call loadNewProgram.
    const [program, setProgram] = useState<AssembledProgram | null>(null);

    // This is a hack to force React to consider state to have changed and then
    // re-render.  Necessary because vmState is not a well-behaved React state
    // variable following functional paradigms (we update it in-place rather
    // than cloning).
    const [timeStep, setTimeStep] = useState(0);

    const { vmState, printkLines, setPrintkLines } = props;

    useInterval(() => {
        if (vmState === null) {
            return;
        }
        const rc = vmState.step();
        const newHotAddress: HotAddressInfo = {
            address: Number(vmState.cpu.hotAddress[0]),
            size: Number(vmState.cpu.hotAddressSize[0]),
        };
        if (newHotAddress.address !== hotAddress.address ||
            newHotAddress.size !== hotAddress.size) {
            setHotAddress(newHotAddress);
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


    // The inner vm is not a react component.  This manages updating
    // the program state and commanding the vm to load it.
    const loadNewProgram = useCallback((newProgram: AssembledProgram) => {
        setProgram(newProgram);

        if (vmState === null) {
            // If the VM isn't loaded yet, just wait.  It'll automatically load
            // our program.
            return;
        }

        vmState.setProgram(newProgram);
        const newHotAddress: HotAddressInfo = {
            address: Number(vmState.cpu.hotAddress[0]),
            size: Number(vmState.cpu.hotAddressSize[0]),
        };
        if (newHotAddress.address === 0) {
            // Set it to the stack pointer, that is likely where
            // the first write will land, so this minimizes the
            // chances we jolt the screen early in the program.
            newHotAddress.address = getStackPointer(vmState);
        }
        setHotAddress(newHotAddress);

        const entrypoint = CreateSchedCloneEntrypoint(1234);

        entrypoint.apply(vmState.memory.heap, vmState.cpu.registers);
    }, [setProgram, vmState, setHotAddress]);

    if (program === null) {
        const assembled = assemble(HELLOWORLD_SOURCE.split('\n'), {});
        loadNewProgram(assembled);
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
        const newHotAddress: HotAddressInfo = {
            address: Number(vmState.cpu.hotAddress[0]),
            size: Number(vmState.cpu.hotAddressSize[0]),
        };
        if (newHotAddress.address !== hotAddress.address ||
            newHotAddress.size !== hotAddress.size) {
            setHotAddress(newHotAddress);
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

    const onSetStackValue = (offset: number, value: number) => {
        vmState.memory.stack[offset] = value;
        setTimeStep(timeStep + 1);
    };
    const onSetHeapValue = (offset: number, value: number) => {
        vmState.memory.heap[offset] = value;
        setTimeStep(timeStep + 1);
    };


    const pc = vmState.cpu.programCounter[0];
    const currentInstruction = vmState.program.getInstructionAtProgramCounter(pc);

    return (
        <Box>
        <Paper sx={{ maxWidth: 936, margin: 'auto', marginBottom: 2, padding: 2, overflow: 'hidden' }}>
            <Memory
                title="Stack"
                memory={vmState.memory.stack}
                numWordsToShow={16}
                startingAddress={vmState.memory.stack.byteOffset}
                hotAddress={hotAddress}
                timeStep={timeStep}
                onSetValue={onSetStackValue}
            />
        </Paper>
        <Paper sx={{ maxWidth: 936, margin: 'auto', marginBottom: 2, padding: 2, overflow: 'hidden' }}>
            <Memory
                title="Heap"
                memory={vmState.memory.heap}
                numWordsToShow={16}
                startingAddress={vmState.memory.heap.byteOffset}
                hotAddress={hotAddress}
                timeStep={timeStep}
                onSetValue={onSetHeapValue}
            />
        </Paper>
        <Paper sx={{ maxWidth: 936, margin: 'auto', marginBottom: 2, padding: 2, overflow: 'hidden' }}>
            { program !== null &&
            <Program 
                programCounter={pc}
                program={program}
                loadNewProgram={loadNewProgram}
            />
            }
        </Paper>
        <Paper sx={{ maxWidth: 936, margin: 'auto', marginBottom: 2, padding: 2, overflow: 'hidden' }}>
            <CpuState 
                instruction={currentInstruction}
                programCounter={pc}
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

export default VmInitializer;
