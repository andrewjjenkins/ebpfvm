import {
    FunctionComponent as FC,
    useEffect,
    useState,
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
import { Typography } from '@mui/material';


interface VmProps {

}

const Vm: FC<VmProps> = (props) => {
    const [vmState, setVmState] = useState<VmState | null>(null);
    const [vmError, setVmError] = useState<string | null>(null);

    // This is a hack to force React to consider state to have changed and then
    // re-render.  Necessary because vmState is not a well-behaved React state
    // variable following functional paradigms (we update it in-place rather
    // than cloning).
    const [timeStep, setTimeStep] = useState(0);

    useEffect(() => {
        newVm().then((vm: VmState) => {setVmState(vm)});
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
            <Memory 
                title="Memory"
                memory={vmState.memory.mem}
                timeStep={timeStep}
            />
            <Memory
                title="Stack"
                memory={vmState.stack.mem}
                numWordsToShow={16}
                startingAddress={vmState.stack.mem.byteOffset}
                hotAddress={stackPointer}
                timeStep={timeStep}
            />
            <Program 
                programCounter={vmState.cpu.programCounter[0]}
                instructions={vmState.program.instructions}
            />
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
        </Box>
    );
};

export default Vm;
