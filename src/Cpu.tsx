import { 
    FunctionComponent as FC,
    useState,
} from 'react';
import structuredClone from '@ungap/structured-clone';
import Box from '@mui/material/Box';
import Program from './Program';
import CpuState from './CpuState';
import StepController from './StepController';

interface CpuProps {

}

const initialCpuState = {
    instruction: 0,
    instructionPointer: 0,
    accumulator: 0,
    index: 0,
    memory: [],
};

const Cpu: FC<CpuProps> = (props) => {
    const [cpuState, setCpuState] = useState(() => {
        return structuredClone(initialCpuState);
    });

    const onStep = () => {
        const instructionPointer = cpuState.instructionPointer += 8;
        setCpuState({...cpuState, instructionPointer});
    };

    const onReset = () => {
        setCpuState(structuredClone(initialCpuState));
    }

    return (
        <Box>
      <Program 
        instructionPointer={cpuState.instructionPointer}
      />
      <CpuState 
      instructionPointer={cpuState.instructionPointer}
      accumulator={cpuState.accumulator}
      index={cpuState.index}
      memory={cpuState.memory}
      />
      <StepController 
        onReset={onReset}
        onStep={onStep}
        onPlay={() => {console.log('play');}}
      />

        </Box>

    );

};

export default Cpu;
