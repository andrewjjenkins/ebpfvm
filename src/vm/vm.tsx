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
import { loadHexbytecode, Program } from './program';
import { Packet } from './packet';
import { HELLOWORLD_HEXBYTECODE } from './consts';

const Ubpf = require('../generated/ubpf.js');

interface UbpfModule extends EmscriptenModule {
    _ebpfvm_create_vm(): number;
    _ebpfvm_get_programcounter_address(): number;
    _ebpfvm_get_registers(): number;
    _ebpfvm_get_memory(): number;
    _ebpfvm_get_memory_len(): number;
    _ebpfvm_get_stack(): number;
    _ebpfvm_get_stack_len(): number;
    _ebpfvm_allocate_instructions(numInstructions: number): number;
    _ebpfvm_get_instructions(): number;
    _ebpfvm_validate_instructions(): number;
    _ebpfvm_exec_step(): number;
}

export class Vm {
    cpu: Cpu;
    memory: Memory;
    stack: Memory;
    program: Program;
    packet: Packet;
    ubpfModule: UbpfModule;

    constructor(cpu: Cpu, memory: Memory, stack: Memory, program: Program, packet: Packet, ubpfModule: UbpfModule) {
        this.cpu = cpu;
        this.memory = memory;
        this.stack = stack;
        this.program = program;
        this.packet = packet;
        this.ubpfModule = ubpfModule;
    }

    step() {
        return this.ubpfModule._ebpfvm_exec_step();
    }
}

export const newVm = () => {
    return Ubpf({
        locateFile: (path: string, scriptDirectory: string) => {
            // This assumes that you have put the .wasm file
            // directly in the top level of public/
            return "/" + path;
        }
    }).then((mod: UbpfModule) => {
        const vmCreateOk = mod._ebpfvm_create_vm();
        if (vmCreateOk !== 0) {
            throw new Error("Failed to create VM");
        }

        const vmProgramCounterOffset = mod._ebpfvm_get_programcounter_address();
        const vmProgramCounter = new Uint16Array(mod.HEAP8.buffer, vmProgramCounterOffset, 2);
        const vmRegistersOffset = mod._ebpfvm_get_registers();
        const vmRegisters = new BigInt64Array(mod.HEAP8.buffer, vmRegistersOffset, 8 * 11);
        const cpu = new Cpu(vmProgramCounter, vmRegisters);

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

        const insts = loadHexbytecode(HELLOWORLD_HEXBYTECODE);
        const allocInsts = mod._ebpfvm_allocate_instructions(insts.byteLength / 8);
        if (allocInsts <= 0) {
            throw new Error("Failed to allocate for VM instructions");
        }
        const instsOffset = mod._ebpfvm_get_instructions();
        const vmInstructions = new Uint8Array(mod.HEAP8.buffer, instsOffset, allocInsts * 8);
        for (let i = 0; i < insts.byteLength; i++) {
            vmInstructions[i] = insts[i];
        }
        const isValid = mod._ebpfvm_validate_instructions();
        if (isValid !== 0) {
            throw new Error("Failed to validate program");
        }
        const program = new Program(vmInstructions);

        const packet = new Packet();
        const vm = new Vm(cpu, memory, stackMemory, program, packet, mod);
        return vm;
    });
};
