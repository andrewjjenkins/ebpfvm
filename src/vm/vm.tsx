import { Cpu } from './cpu';
import { Memory, newMemoryFromString } from './memory';
import { newProgramFromAsmSource, Program } from './program';
import { Packet } from './packet';
import { DEFAULT_MEMORY_INIT, DEFAULT_MEMORY_MIN_SIZE, DEFAULT_PROGRAM } from './consts';


class Vm {
    cpu: Cpu;
    memory: Memory;
    program: Program;
    packet: Packet;

    constructor(cpu: Cpu, memory: Memory, program: Program, packet: Packet) {
        this.cpu = cpu;
        this.memory = memory;
        this.program = program;
        this.packet = packet;
    }
}

export const newVm = () => {
    const cpu = new Cpu();
    const memory = newMemoryFromString(DEFAULT_MEMORY_INIT, DEFAULT_MEMORY_MIN_SIZE);
    const program = newProgramFromAsmSource(DEFAULT_PROGRAM);
    const packet = new Packet();
    const vm = new Vm(cpu, memory, program, packet);
    return vm;
};
