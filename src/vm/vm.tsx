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
        debugger;
        const vmCreateOk = (mod as any)._ebpfvm_create_vm();
        if (vmCreateOk != 0) {
            throw new Error("Failed to create VM");
        }
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
        const insts = program.getInstructions();
        const allocInsts = (mod as any)._ebpfvm_allocate_instructions(1);
        if (allocInsts <= 0) {
            throw new Error("Failed to allocate for VM instructions");
        }
        const instsOffset = (mod as any)._ebpfvm_get_instructions();
        const vmInstructions = new Uint8Array(mod.HEAP8.buffer, instsOffset, allocInsts * 8);
        //console.assert(vmInstructions.byteLength >= insts.byteLength);
        // for (let i = 0; i < insts.byteLength; i++) {
        //     vmHeap[i] = insts[i];
        // }
        // const x = (mod as any)._ajj_load(insts.byteLength);
        vmInstructions[0] = 0xb7;
        vmInstructions[1] = 0x01;
        vmInstructions[2] = 0x00;
        vmInstructions[3] = 0x00;
        vmInstructions[4] = 0x00;
        vmInstructions[5] = 0x00;
        vmInstructions[6] = 0x00;
        vmInstructions[7] = 0x00;
        const isValid = (mod as any)._ebpfvm_validate_instructions();
        if (isValid != 0) {
            throw new Error("Failed to validate program");
        }

        const packet = new Packet();
        const vm = new Vm(cpu, memory, program, packet);
        return vm;
    });
};
