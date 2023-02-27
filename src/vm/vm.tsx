import { Cpu } from './cpu';
import { Memory } from './memory';
import { newProgramFromAsmSource, Program } from './program';
import { Packet } from './packet';
import { DEFAULT_MEMORY_INIT, DEFAULT_PROGRAM } from './consts';

const UbpfModule = require('./ubpf.js');

export class Vm {
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
    return UbpfModule({
        locateFile: (path: string, scriptDirectory: string) => {
            // This assumes that you have put the .wasm file
            // directly in the top level of public/
            return "/" + path;
        }
    }).then((mod: EmscriptenModule) => {
        const vmOffset = (mod as any)._getVmMemory();
        const vmSize = (mod as any)._getVmMemorySize();
        const vmHeap = new Uint8Array(mod.HEAP8.buffer, vmOffset, vmSize);

        const cpu = new Cpu();

        const memory = new Memory({
            buffer: vmHeap,
            memoryInit: DEFAULT_MEMORY_INIT,
        });
        if ((vmSize % 4) !== 0) {
            console.warn("vmSize is %d, not divisible by 32", vmSize)
        }

        const program = newProgramFromAsmSource(DEFAULT_PROGRAM);
        const packet = new Packet();
        const vm = new Vm(cpu, memory, program, packet);
        return vm;
    });
};
