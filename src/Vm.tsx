import {
    FunctionComponent as FC,
    useState,
} from 'react';
import Box from '@mui/material/Box';
import { newVm } from './vm/vm';
import Memory from './Memory';
import Program from './Program';
import CpuState from './CpuState';
import StepController from './StepController';


interface VmProps {

}

const Vm: FC<VmProps> = (props) => {
    const [vmState] = useState(() => newVm());

    // This is a hack to force React to consider state to have changed and then
    // re-render.  Necessary because vmState is not a well-behaved React state
    // variable following functional paradigms (we update it in-place rather
    // than cloning).
    const [timeStep, setTimeStep] = useState(0);

    const onReset = () => {
        vmState.cpu.instructionPointer = 0;
        setTimeStep(timeStep + 1);
    };
    const onStep = () => {
        vmState.cpu.instructionPointer += 8;
        setTimeStep(timeStep + 1);
    };

    const instructionIndex = vmState.cpu.instructionPointer / 8;
    const currentInstruction = vmState.program.instructions[instructionIndex];

    return (
        <Box>
            <Memory 
                memory={vmState.memory.mem}
            />
            <Program 
                instructionPointer={vmState.cpu.instructionPointer}
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
