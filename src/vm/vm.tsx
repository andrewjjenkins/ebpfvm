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
import { Cpu } from './cpu';
import { Memory } from './memory';
import { Program, AssembledProgram } from './program';
import { Packet } from './packet';

const Ubpf = require('../generated/ubpf.js');

const MAX_PROGRAM_SIZE = 16*512;  // bytes

interface UbpfModule extends EmscriptenModule {
    // These are all the EMSCRIPTEN_KEEPALIVE functions in
    // ubpf/ebpfvm_emscripten.c
    _ebpfvm_create_vm(logCallback: number): number;
    _ebpfvm_get_programcounter_address(): number;
    _ebpfvm_get_registers(): number;
    _ebpfvm_get_hot_address(): number;
    _ebpfvm_get_memory(): number;
    _ebpfvm_get_memory_len(): number;
    _ebpfvm_get_stack(): number;
    _ebpfvm_get_stack_len(): number;
    _ebpfvm_allocate_instructions(numInstructions: number): number;
    _ebpfvm_get_instructions(): number;
    _ebpfvm_validate_instructions(numInstructions: number): number;
    _ebpfvm_exec_step(): number;

    // These are controlled by '-s EXPORT_RUNTIME_FUNCTIONS' in the emcc step
    addFunction(f: (...args: any[])=>any, signature: string): number
    UTF8ToString(wasmAddress: number): string;
}

export class Vm {
    cpu: Cpu;
    memory: Memory;
    stack: Memory;
    program: Program;
    packet: Packet;
    ubpfModule: UbpfModule;
    maxProgramSize: number;

    constructor(cpu: Cpu, memory: Memory, stack: Memory, program: Program, packet: Packet, ubpfModule: UbpfModule, maxProgramSize: number) {
        this.cpu = cpu;
        this.memory = memory;
        this.stack = stack;
        this.program = program;
        this.packet = packet;
        this.ubpfModule = ubpfModule;
        this.maxProgramSize = maxProgramSize;
    }

    step() {
        return this.ubpfModule._ebpfvm_exec_step();
    }

    reset() {
        this.cpu.programCounter[0] = 0;
        for (let i = 0; i < this.memory.mem32.length; i++) {
            this.memory.mem32[i] = 0;
        }
        for (let i = 0; i < this.stack.mem32.length; i++) {
            this.stack.mem32[i] = 0;
        }
    }

    setProgram(program: AssembledProgram) {
        this.program = new Program(program.instructions);

        if (this.program.byteLength > this.maxProgramSize) {
            throw new Error(`New program too big (${this.program.byteLength} > ${this.maxProgramSize})`);
        }

        const instructionBytes = this.program.getInstructions();
        const instsOffset = this.ubpfModule._ebpfvm_get_instructions();
        const vmInstructions = new Uint8Array(this.ubpfModule.HEAP8.buffer, instsOffset, instructionBytes.byteLength);
        for (let i = 0; i < instructionBytes.byteLength; i++) {
            vmInstructions[i] = instructionBytes[i];
        }
        const isValid = this.ubpfModule._ebpfvm_validate_instructions(instructionBytes.byteLength / 8);
        if (isValid !== 0) {
            // FIXME: Maybe we should store the old program first, in case this one
            // fails to validate?  Now we're just busted...
            throw new Error("Failed to validate program");
        }
    }
}

export const newVm = (printkLog: (s: string) => void) => {
    return Ubpf({
        locateFile: (path: string, scriptDirectory: string) => {
            // This assumes that you have put the .wasm file
            // directly in the top level of public/
            return process.env.PUBLIC_URL + "/" + path;
        }
    }).then((mod: UbpfModule) => {
        const logJsString = (wasmS: number) => printkLog(mod.UTF8ToString(wasmS));
        const myLogWasmSlot: number = mod.addFunction(logJsString, 'vi');
        const vmCreateOk = mod._ebpfvm_create_vm(myLogWasmSlot);
        if (vmCreateOk !== 0) {
            throw new Error("Failed to create VM");
        }

        const vmProgramCounterOffset = mod._ebpfvm_get_programcounter_address();
        const vmProgramCounter = new Uint16Array(mod.HEAP8.buffer, vmProgramCounterOffset, 2);
        const vmRegistersOffset = mod._ebpfvm_get_registers();
        const vmRegisters = new BigInt64Array(mod.HEAP8.buffer, vmRegistersOffset, 8 * 11);
        const vmHotAddressOffset = mod._ebpfvm_get_hot_address();
        const vmHotAddress = new BigUint64Array(mod.HEAP8.buffer, vmHotAddressOffset, 1);
        const cpu = new Cpu(vmProgramCounter, vmRegisters, vmHotAddress);

        const vmHeapOffset = mod._ebpfvm_get_memory();
        const vmHeapSize = mod._ebpfvm_get_memory_len();
        const vmHeap = new Uint8Array(mod.HEAP8.buffer, vmHeapOffset, vmHeapSize);
        const memory = new Memory({
            buffer: vmHeap,
            //memoryInit: DEFAULT_MEMORY_INIT,
        });
        if ((vmHeapSize % 4) !== 0) {
            console.warn("vmHeapSize is %d, not divisible by 32", vmHeapSize);
        }

        const vmStackOffset = mod._ebpfvm_get_stack();
        const vmStackSize = mod._ebpfvm_get_stack_len();
        const vmStack = new Uint8Array(mod.HEAP8.buffer, vmStackOffset, vmStackSize);
        const stackMemory = new Memory({
            buffer: vmStack,
        });
        if ((vmStackSize % 4) !== 0) {
            console.warn("vmStackSize is %d, not divisible by 32", vmStackSize);
        }

        const toAllocForInstructions = MAX_PROGRAM_SIZE;
        const allocInsts = mod._ebpfvm_allocate_instructions(toAllocForInstructions / 8);
        if (allocInsts <= 0) {
            throw new Error("Failed to allocate for VM instructions");
        }
        const program = new Program([]);

        const packet = new Packet();
        const vm = new Vm(cpu, memory, stackMemory, program, packet, mod, toAllocForInstructions);
        return vm;
    });
};
