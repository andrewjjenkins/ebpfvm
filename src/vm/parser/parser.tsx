import { Parser } from './ebpf';
import { OperandsModes } from './consts';

export interface ParsedInstruction {
    mode: OperandsModes;
    opcode: string;
    lineNumber: number;
    k?: number;
    register?: string;
    true?: string;
    false?: string;
    label?: string;
    extension?: string;
}

export type ParsedLabels = {[label: string]: number};

interface ParseResult {
    instructions: ParsedInstruction[];
    labels: ParsedLabels;
}

export const parse = (prog: string): ParseResult => {
    const p = new Parser();
    p. yy = {
        labels: {},
        current: {},
        instructions: [],
        OperandsModes: OperandsModes,
        currentLine: 1,
    };
    const out = p.parse(prog);
    return {
        instructions: p.yy.instructions,
        labels: p.yy.labels,
    };
};
