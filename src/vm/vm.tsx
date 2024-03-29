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
import { Maps } from './maps';
import { BIG_MAX_32, BIG_NEGATIVE_ONE } from './consts';

const Ubpf = require('../generated/ubpf.js');

const MAX_PROGRAM_SIZE = 16*512;  // bytes

interface UbpfModule extends EmscriptenModule {
    // These are all the EMSCRIPTEN_KEEPALIVE functions in
    // ubpf/ebpfvm_emscripten.c
    _ebpfvm_create_vm(logCallback: number, trampolineCallback: number): number;
    _ebpfvm_get_programcounter_address(): number;
    _ebpfvm_get_registers(): number;
    _ebpfvm_get_hot_address(): number;
    _ebpfvm_get_hot_address_size(): number;
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

type EbpfvmCallback =
    (vm: Vm, r1: BigInt, r2: BigInt, r3: BigInt, r4: BigInt, r5: BigInt) => BigInt;

export class Vm {
    cpu: Cpu;
    memory: Memory;
    program: Program;
    packet: Packet;
    maps: Maps;
    ubpfModule: UbpfModule;
    maxProgramSize: number;

    constructor(cpu: Cpu, memory: Memory, program: Program, packet: Packet, ubpfModule: UbpfModule, maxProgramSize: number) {
        this.cpu = cpu;
        this.memory = memory;
        this.program = program;
        this.packet = packet;
        this.maps = new Maps();
        this.ubpfModule = ubpfModule;
        this.maxProgramSize = maxProgramSize;
    }

    step() {
        return this.ubpfModule._ebpfvm_exec_step();
    }

    reset() {
        this.cpu.programCounter[0] = 0;

        for (let i = 0; i < this.memory.heap.length; i++) {
            this.memory.heap[i] = 0;
        }
        for (let i = 0; i < this.memory.stack.length; i++) {
            this.memory.stack[i] = 0;
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

export interface NewVmOptions {
    callbacks?: EbpfvmCallback[];

    // Special callbacks that don't have the generic r1, r2, r3, r4, r5
    // call signature (some processing is done in C).
    printkCallback?: (s: string) => void;
}

type EbpfvmCallbackTrampoline = (internalVm: number, call: BigInt, r1: BigInt, r2: BigInt, r3: BigInt, r4: BigInt, r5: BigInt) => BigInt;

export const newVm = (options: NewVmOptions) => {
    return Ubpf({
        locateFile: (path: string, scriptDirectory: string) => {
            // This assumes that you have put the .wasm file
            // directly in the top level of public/
            return process.env.PUBLIC_URL + "/" + path;
        }
    }).then((mod: UbpfModule) => {
        const printkCallback = options.printkCallback || ((s: string) => console.warn("printk_trace: " + s));
        const logJsString = (wasmS: number) => printkCallback(mod.UTF8ToString(wasmS));
        const myLogWasmSlot: number = mod.addFunction(logJsString, 'vi');

        const myCallTrampoline: EbpfvmCallbackTrampoline = (internalVm: number, call: BigInt, r1: BigInt, r2: BigInt, r3: BigInt, r4: BigInt, r5: BigInt) => {
            // internalVm is a pointer to "struct ubpf_vm" (in C); don't use.

            if (call > BIG_MAX_32) {
                printkCallback(`Unhandled large callback ${call}`);
                return BIG_NEGATIVE_ONE;
            }
            const smallCall = Number(call);

            if (!options.callbacks || !options.callbacks[smallCall]) {
                printkCallback(`Unhandled callback ${call}`);
                return BIG_NEGATIVE_ONE;
            }

            const cb = options.callbacks[smallCall];
            return cb(vm, r1, r2, r3, r4, r5);
        };
        const myCallTrampolineSlot: number = mod.addFunction(myCallTrampoline, 'jijjjjjj');

        const vmCreateOk = mod._ebpfvm_create_vm(myLogWasmSlot, myCallTrampolineSlot);
        if (vmCreateOk !== 0) {
            throw new Error("Failed to create VM");
        }

        const vmProgramCounterOffset = mod._ebpfvm_get_programcounter_address();
        const vmProgramCounter = new Uint16Array(mod.HEAP8.buffer, vmProgramCounterOffset, 1);
        const vmRegistersOffset = mod._ebpfvm_get_registers();
        const vmRegisters = new BigUint64Array(mod.HEAP8.buffer, vmRegistersOffset, 11);
        const vmHotAddressOffset = mod._ebpfvm_get_hot_address();
        const vmHotAddress = new BigUint64Array(mod.HEAP8.buffer, vmHotAddressOffset, 1);
        const vmHotAddressSizeOffset = mod._ebpfvm_get_hot_address_size();
        const vmHotAddressSize = new BigUint64Array(mod.HEAP8.buffer, vmHotAddressSizeOffset, 1);
        const cpu = new Cpu(vmProgramCounter, vmRegisters, vmHotAddress, vmHotAddressSize);

        const vmHeapOffset = mod._ebpfvm_get_memory();
        const vmHeapSize = mod._ebpfvm_get_memory_len();
        if ((vmHeapSize % 4) !== 0) {
            console.warn("vmHeapSize is %d, not divisible by 32", vmHeapSize);
        }
        const vmStackOffset = mod._ebpfvm_get_stack();
        const vmStackSize = mod._ebpfvm_get_stack_len();
        if ((vmStackSize % 4) !== 0) {
            console.warn("vmStackSize is %d, not divisible by 32", vmStackSize);
        }
        const memory = new Memory({
            buffer: mod.HEAP8.buffer,
            heapOffset: vmHeapOffset,
            heapSize: vmHeapSize,
            stackOffset: vmStackOffset,
            stackSize: vmStackSize,
        });

        const toAllocForInstructions = MAX_PROGRAM_SIZE;
        const allocInsts = mod._ebpfvm_allocate_instructions(toAllocForInstructions / 8);
        if (allocInsts <= 0) {
            throw new Error("Failed to allocate for VM instructions");
        }
        const program = new Program([]);

        const packet = new Packet();
        const vm = new Vm(cpu, memory, program, packet, mod, toAllocForInstructions);
        return vm;
    });
};
