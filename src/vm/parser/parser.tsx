import { Parser } from './ebpf';
import { OperandsModes } from './consts';

export const parse = (prog: string) => {
    const p = new Parser();
    p. yy = {
        current: {},
        instructions: [],
        OperandsModes: OperandsModes,
        currentLine: 1,
    };
    const out = p.parse(prog);
    return p.yy.instructions;
};
