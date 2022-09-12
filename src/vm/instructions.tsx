import * as c from "./consts";

const bytesToOpSize = (numBytes: number): c.InstructionOpSize => {
    switch (numBytes) {
        case 1:
            return c.InstructionOpSize.BPF_B;
        case 2:
            return c.InstructionOpSize.BPF_H;
        case 4:
            return c.InstructionOpSize.BPF_W;
        default:
            throw new Error(`invalid size (must be 1, 2 or 4 bytes, got ${numBytes})`);
    }
};

// These are the addressing modes from
// https://www.kernel.org/doc/Documentation/networking/filter.txt
enum OperandsModes {
    Register, // Mode 0
    Packet,
    PacketOffset,
    Memory,
    Immediate,
    FourXPacketNibble,
    Label,
    JumpTFImmediate,
    JumpTFRegister,
    JumpImmediate,
    JumpRegister,
    Accumulator,
    Extension, // Mode 12
}

interface OperandsRegister {
    mode: OperandsModes.Register,
    register: string,
}
interface OperandsPacket {
    mode: OperandsModes.Packet,
    offset: number,
}

interface OperandsPacketOffset {
    mode: OperandsModes.PacketOffset,
    offset: number,
}

interface OperandsMemory {
    mode: OperandsModes.Memory,
    offset: number,
}

interface OperandsImmediate {
    mode: OperandsModes.Immediate,
    imm: number,
}

type ParsedOperands = 
OperandsRegister | OperandsPacket | OperandsPacketOffset |
OperandsMemory | OperandsImmediate;

const parseOperands = (operands: string[]): ParsedOperands => {
    switch (operands[0][0]) {
        case '[':
            if (operands[0].slice(-1) !== ']') {
                throw new Error ('invalid load, missing ]');
            }
            const val = operands[0].slice(1, -1);
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
                    mode: OperandsModes.PacketOffset,
                    offset,
                };
            }
            return {
                mode: OperandsModes.Packet,
                offset,
            };

        case '#':
        case 'M':
        case '4':
        case '%':
    }


};

const emitLoad = (operands: string[], numBytes: number, allowMem: boolean): c.UnpackedInstruction => {
    if (operands.length !== 1) {
        throw new Error(`load expected 1 op, got ${operands.length}`);
    }
    if (operands[0].length < 2) {
        throw new Error(`load invalid op: ${operands[0]}`);
    }
    const loadSize = bytesToOpSize(numBytes);
    const loadOpAndSize = c.InstructionClass.BPF_LD | loadSize;

    switch (operands[0][0]) {
        case '[':
            if (operands[0].slice(-1) !== ']') {
                throw new Error ('invalid load, missing ]');
            }
            const val = operands[0].slice(1, -1);
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
                    opcode: loadOpAndSize | c.InstructionOpMode.BPF_IND,
                    destReg: 0x00,
                    sourceReg: c.InstructionSource.BPF_X,
                    offset,
                    immediate: 0,
                };
            }
            return {
                opcode: loadOpAndSize | c.InstructionOpMode.BPF_ABS,
                destReg: 0x00,
                sourceReg: 0x00,
                offset,
                immediate: 0,
            }

        case '#':
        case 'M':
        case '4':
    }

    // FIXME: don't need once we handle all the cases
    return {
                opcode: loadOpAndSize | c.InstructionOpMode.BPF_ABS,
                destReg: 0x00,
                sourceReg: 0x00,
                offset: 0,
                immediate: 0,
    };
}

type SingleEncoderType = (operands: string[]) => Uint8Array;
type EncoderType = {[key: string]: SingleEncoderType};

export const encoder: EncoderType = {
    ld: (operands: string[]) => pack(emitLoad(operands, 4, false)),
    ldh: (operands: string[]) => pack(emitLoad(operands, 2, false)),
    ldb: (operands: string[]) => pack(emitLoad(operands, 1, false)),
};


// FIXME: Assumes big-endian.
export const pack = (u: c.UnpackedInstruction) => {
    const encoded = new Uint8Array(8);

    encoded[0] = u.opcode;
    encoded[1] = ((u.destReg << 4) & 0xf0) | (u.sourceReg & 0x0f);
    encoded[2] = (u.offset >> 8) & 0xff;
    encoded[3] = u.offset & 0xff;
    encoded[4] = (u.immediate >> 24) & 0xff;
    encoded[5] = (u.immediate >> 16) & 0xff;
    encoded[6] = (u.immediate >> 8) & 0xff;
    encoded[7] = u.immediate & 0xff;
    return encoded;
};
