import { Cpu } from './cpu';
import { Memory } from './memory';
import { loadHexbytecode, Program } from './program';
import { Packet } from './packet';
import { DEFAULT_MEMORY_INIT, HELLOWORLD_HEXBYTECODE } from './consts';

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
        const vmCreateOk = (mod as any)._ebpfvm_create_vm();
        if (vmCreateOk !== 0) {
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

        const insts = loadHexbytecode(HELLOWORLD_HEXBYTECODE);
        const allocInsts = (mod as any)._ebpfvm_allocate_instructions(insts.byteLength / 8);
        if (allocInsts <= 0) {
            throw new Error("Failed to allocate for VM instructions");
        }
        const instsOffset = (mod as any)._ebpfvm_get_instructions();
        const vmInstructions = new Uint8Array(mod.HEAP8.buffer, instsOffset, allocInsts * 8);
        for (let i = 0; i < insts.byteLength; i++) {
            vmInstructions[i] = insts[i];
        }
        const isValid = (mod as any)._ebpfvm_validate_instructions();
        if (isValid !== 0) {
            throw new Error("Failed to validate program");
        }
        const program = new Program(vmInstructions);

        const packet = new Packet();
        const vm = new Vm(cpu, memory, program, packet);
        return vm;
    });
};
