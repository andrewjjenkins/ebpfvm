import structuredClone from '@ungap/structured-clone';
import { encoder } from './instructions';
import { parse } from './parser/parser';
import {resolve} from './symbols';

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

    constructor() {
        this.labels = {};
        this.instructions = [];
    }

    loadProgramFromAsmSource(asmSource: string[]) {
        const assembled = assemble(asmSource, {});
        this.labels = assembled.labels;
        this.instructions = assembled.instructions;
    }
}

export const newProgramFromAsmSource = (asmSource: string[]) => {
    const program = new Program();
    program.loadProgramFromAsmSource(asmSource);
    return program;
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
