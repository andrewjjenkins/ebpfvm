import { Cpu } from './cpu';
import { Memory } from './memory';
import { newProgramFromAsmSource, Program } from './program';
import { Packet } from './packet';
import { DEFAULT_MEMORY_INIT, DEFAULT_PROGRAM, InstructionClass, InstructionSource } from './consts';

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

const helloWorldByteCode =
"b70100006c210a00631af8ff00000000180100006c6f6e65000000002063" +
"616c7b1af0ff0000000018010000206120730000000079735f637b1ae8ff" +
"00000000180100007265204900000000206469647b1ae0ff000000001801" +
"00006f726c6400000000212048657b1ad8ff000000001801000048656c6c" +
"000000006f2c20577b1ad0ff00000000bfa100000000000007010000d0ff" +
"ffffb70200002c0000008500000006000000b70000000000000095000000" +
"00000000";

const byteCodeToBytes = (byteCodeText: string) => {
    const textNoWs = byteCodeText.split("\n").join("");

    console.assert(textNoWs.length % 16 == 0);

    const arraySz = Math.floor(textNoWs.length / 2);
    const numInsns = Math.floor(arraySz / 8);

    const instructions = new Uint8Array(arraySz);
    for (let i = 0; i < arraySz; i++) {
        instructions[i] = parseInt(textNoWs.slice(i * 2, i * 2 + 2), 16);
    }
    return instructions;
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
        //const insts = program.getInstructions();
        // const insts = asmToBytes(arpAsm);
        const insts = byteCodeToBytes(helloWorldByteCode);
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
        if (isValid != 0) {
            throw new Error("Failed to validate program");
        }

        const packet = new Packet();
        const vm = new Vm(cpu, memory, program, packet);
        return vm;
    });
};
