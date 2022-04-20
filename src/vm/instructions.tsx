import * as c from "./consts";

const emitLoad = (operands: string[], allowMem: boolean): c.UnpackedInstruction => {
    if (operands.length != 1) {
        throw new Error(`load expected 1 op, got ${operands.length}`);
    }
    if (operands[0].length < 2) {
        throw new Error(`load invalid op: ${operands[0]}`);
    }
    switch (operands[0][0]) {
        case '[':
            if (operands[0][-1] !== ']') {
                throw new Error ('invalid load, missing ]');
            }
            const val = operands[0].slice(1, operands[0].length - 2);
            const [lhs, rhs] = val.split('+');
            const offsetString = (rhs !== undefined) ? rhs : lhs;
            const offset = parseInt(offsetString, 0);
            if (isNaN(offset)) {
                throw new Error(`Could not parse offset ${rhs} as int`);
            }
            if (offset < 0 || offset > c.OFFSET_MAX) {
                throw new Error(`Offset ${offset} too large`);
            }

            if (rhs !== undefined) {
                if (lhs.toLowerCase() !== 'x') {
                    throw new Error(`invalid load index ${lhs} (must be x)`);
                }
                return {
                    opcode: c.InstructionClass.BPF_LD | c.InstructionOpMode.BPF_IND,
                    destReg: 0x00,
                    sourceReg: c.InstructionSource.BPF_X,
                    offset,
                    immediate: 0,
                };
            }
            return {
                opcode: c.InstructionClass.BPF_LD | c.InstructionOpMode.BPF_ABS,
                destReg: 0x00,
                sourceReg: 0x00,
                offset,
                immediate: 0,
            }
            break;

        case '#':
        case 'M':
        case '4':
    }

    // FIXME: don't need once we handle all the cases
    return {
                opcode: c.InstructionClass.BPF_LD | c.InstructionOpMode.BPF_ABS,
                destReg: 0x00,
                sourceReg: 0x00,
                offset: 0,
                immediate: 0,
    };
}

class InstructionEncoder {
    ldb(operands: string[]) {

    }
}

const encodeUnpackedInstruction = (u: c.UnpackedInstruction) => {
    const encoded = new Uint8Array(8);

    encoded[0] = u.opcode;
    encoded[1] = ((u.destReg << 4) & 0xf0) | (u.sourceReg & 0x0f);
    encoded[2] = u.offset >> 8 & 0xff;
    encoded[3] = u.offset & 0xff;
    encoded[4] = u.immediate >> 24 & 0xff;
    encoded[5] = u.immediate >> 16 & 0xff;
    encoded[6] = u.immediate >> 8 & 0xff;
    encoded[7] = u.immediate & 0xff;
    return encoded;
};
