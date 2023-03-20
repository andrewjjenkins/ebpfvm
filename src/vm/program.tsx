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
import { parse } from './parser/parser';
import { resolve } from './symbols';
import { encoder } from './instructions';
import { NumbersOutlined } from '@mui/icons-material';

export interface Instruction {
    // The assembly version of this instruction, like:
    // 'fooLabel:   jeq #ETHERTYPE_IP, L1, L2',
    asmSource: string;

    machineCode: Uint8Array;
}

export type Symbols = {[symbol: string]: number};

export class Program {
    labels: Symbols;
    instructions: Instruction[];

    constructor(instructions: Instruction[]) {
        this.labels = {};
        this.instructions = instructions;
    }

    getInstructions() {
        // FIXME: We should cache this.

        const numInstructions = this.instructions.length;

        // lddw is 16 bytes (2 encoded instructions)
        let numBytes = 0;
        for (let i = 0; i < numInstructions; i++) {
            numBytes += this.instructions[i].machineCode.byteLength;
        }

        const instArray = new Uint8Array(numBytes);
        let byteOffset = 0;
        for (let i = 0; i < numInstructions; i++) {
            for (let j = 0; j < this.instructions[i].machineCode.byteLength; j++) {
                instArray[byteOffset + j] = this.instructions[i].machineCode[j];
            }
            byteOffset += this.instructions[i].machineCode.byteLength;
        }
        return instArray;
    }

    getInstructionAtProgramCounter(pc: number) {
        let counter = 0;
        for (let i = 0; i < this.instructions.length; i++) {
            if (counter === pc) {
                return this.instructions[i];
            }
            counter += this.instructions[i].machineCode.byteLength / 8;
        }
        return null;
    }
}

export interface AssembledProgram {
    labels: Symbols;
    instructions: Instruction[];
}

export const assemble = (
    asmSource: string[],
    symbols: Symbols,
) => {
    const instructions: Instruction[] = [];

    const parsed = parse(asmSource.join('\n') + '\n');
    const resolved = resolve(parsed.instructions, parsed.labels, symbols);

    for (let i = 0; i < resolved.length; i++) {
        const inst = resolved[i];
        const assembledInstruction: Instruction = {
            // line numbers count from 1.
            asmSource: asmSource[inst.lineNumber - 1],
            machineCode: new Uint8Array(8),
        };

        if (!(inst.opname in encoder)) {
            throw new Error(`Unimplemented opcode ${inst.opname}`);
        }
        const encoded = encoder[inst.opname](inst);
        assembledInstruction.machineCode = encoded;

        instructions.push(assembledInstruction);
    }

    return {
        instructions,
        labels: parsed.labels,
    };
};
