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
export interface Instruction {
    // The assembly version of this instruction, like:
    // 'fooLabel:   jeq #ETHERTYPE_IP, L1, L2',
    asmSource: string;

    machineCode: Uint8Array;
}

export type Symbols = {[symbol: string]: number};

export class Program {
    labels: Symbols;
    instructions: Uint8Array;

    constructor(instructions: Uint8Array) {
        this.labels = {};
        this.instructions = instructions;
    }

    /*
    getInstructions() {
        const numInstructions = this.instructions.length;
        const instArray = new Uint8Array(8 * numInstructions);
        for (let i = 0; i < numInstructions; i++) {
            console.assert(this.instructions[i].machineCode.byteLength === 8);
            for (let j = 0; j < 8; j++) {
                instArray[i * 8 + j] = this.instructions[i].machineCode[j];
            }
        }
        return instArray;
    }
    */
}

export interface AssembledProgram {
    labels: Symbols;
    instructions: Instruction[];
}


export const loadHexbytecode = (bytecode: string) => {
    const textNoWs = bytecode.split("\n").join("");

    console.assert(textNoWs.length % 16 === 0);

    const arraySz = Math.floor(textNoWs.length / 2);

    const instructions = new Uint8Array(arraySz);
    for (let i = 0; i < arraySz; i++) {
        instructions[i] = parseInt(textNoWs.slice(i * 2, i * 2 + 2), 16);
    }
    return instructions;

};

/*
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

        if (!(inst.opcode in encoder)) {
            throw new Error(`Unimplemented opcode ${inst.opcode}`);
        }
        const encoded = encoder[inst.opcode](inst);
        assembledInstruction.machineCode = encoded;

        instructions.push(assembledInstruction);
    }

    return {
        instructions,
        labels: parsed.labels,
    };
};
*/
