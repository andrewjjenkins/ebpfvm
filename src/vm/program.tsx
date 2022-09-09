import structuredClone from '@ungap/structured-clone';
import { encoder } from './instructions';

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

    for (let i = 0; i < asmSource.length; i++) {
        const asmSourceLine = asmSource[i];
        const inst: Instruction = {
            asmSource: asmSourceLine,
            machineCode: new Uint8Array(8),
        };
        const address = i * 8;

        const [noComment] = asmSourceLine.split('//', 1);

        const colonSplits = noComment.split(':', 2);
        const instructionLabels = (colonSplits.length === 2 ? colonSplits[0] : '').trim();
        const instructionText = (colonSplits.length === 2 ? colonSplits[1] : colonSplits[0]).trim();

        instructionLabels.split(',').forEach((l: string) => {
            if (l === "") {
                return;
            }
            const labelNoWhitespace = l.trim();
            if (labelNoWhitespace in labels) {
                throw new Error(`Duplicate label ${labelNoWhitespace}`);
            }
            labels[labelNoWhitespace] = address;
        });

        const [opcode, allOperands] = instructionText.split(' ', 2).map(x => x.trim().toLowerCase())
        const operands = allOperands.split(',').map(x => x.trim());

        if (encoder[opcode] === undefined) {
            throw new Error(`Unknown opcode ${opcode}`);
        }
        const encoded = encoder[opcode](operands);

        inst.machineCode = encoded;

        // FIXME: Set the machine code.
        // FIXME: If this instruction is labeled, set it.

        instructions.push(inst);
    }

    return {
        symbols: syms,
        labels,
        instructions,
    };
};
