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
        vmState.cpu.instructionPointer = 0;
        setTimeStep(timeStep + 1);
    };
    const onStep = () => {
        vmState.cpu.instructionPointer += 8;
        setTimeStep(timeStep + 1);
    };


    // FIXME
    // const instructionIndex = vmState.cpu.instructionPointer / 8;
    //const currentInstruction = vmState.program.instructions[instructionIndex];
    const machineCode = new Uint8Array(
        vmState.program.instructions.buffer,
        vmState.program.instructions.byteOffset + vmState.cpu.instructionPointer,
        8)
    const currentInstruction = {
        asmSource: "# foobar",
        machineCode: machineCode,
    };

    return (
        <Box>
            <Memory 
                memory={vmState.memory.mem}
            />
            <Program 
                instructionPointer={vmState.cpu.instructionPointer}
                instructions={vmState.program.instructions}
            />
            <CpuState 
                instruction={currentInstruction}
                instructionPointer={vmState.cpu.instructionPointer}
                accumulator={vmState.cpu.accumulator}
                index={vmState.cpu.index}
            />
            <StepController 
                onReset={onReset}
                onStep={onStep}
                onPlay={() => {console.log('play');}}
            />
        </Box>
    );
};

export default Vm;
