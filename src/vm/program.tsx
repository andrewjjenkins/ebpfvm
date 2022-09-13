import structuredClone from '@ungap/structured-clone';
import { encoder } from './instructions';
import { parse } from './parser/parser';

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


interface UnresolvedSymbol {
    symbol: string;
    instruction: Instruction;
}



export const assemble = (
    asmSource: string[],
    symbols: Symbols,
) => {
    const unresolvedSymbols: UnresolvedSymbol[] = [];
    const syms = structuredClone(symbols);
    const labels: Symbols = {};
    const instructions: Instruction[] = [];

    const parsed = parse(asmSource.join('\n') + '\n');

    for (let i = 0; i < parsed.instructions.length; i++) {
        const inst = parsed.instructions[i];
        const assembledInstruction: Instruction = {
            // FIXME: this is wrong and will not handle comment lines.
            asmSource: asmSource[i],
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
        symbols: syms,
        labels,
        instructions,
    };
};
