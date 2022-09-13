import * as c from "./consts";
import { OperandsModes } from "./parser/consts";
import { ParsedInstruction } from "./parser/parser";

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

const modeToOpMode = (m: OperandsModes): c.InstructionOpMode => {
    switch (m) {
        case OperandsModes.Immediate:
            return c.InstructionOpMode.BPF_IMM;
        case OperandsModes.Packet:
            return c.InstructionOpMode.BPF_ABS;
        case OperandsModes.PacketOffset:
            return c.InstructionOpMode.BPF_IND;
        default:
            throw new Error(`Unimplemented mode: ${m}`);
    }
};

const emitLoad = (i: ParsedInstruction, numBytes: number, allowMem: boolean): c.UnpackedInstruction => {
    const loadSize = bytesToOpSize(numBytes);
    const encodedOpmode = modeToOpMode(i.mode);
    const opcode = c.InstructionClass.BPF_LD | loadSize | encodedOpmode;

    switch (i.mode) {
        case OperandsModes.Immediate:
            if (i.immediate === undefined) {
                throw new Error(`Load: no immediate`);
            }
            return {
                opcode,
                jt: 0,
                jf: 0,
                k: i.immediate,
            };
        case OperandsModes.Packet:
            if (i.offset === undefined) {
                throw new Error(`Load: no offset`);
            }
            return {
                opcode,
                jt: 0,
                jf: 0,
                k: i.offset,
            }

        case OperandsModes.Memory:
        case OperandsModes.PacketOffset:
        case OperandsModes.Extension:
        default:
            throw new Error(`Load: unimplemented`);
    }
}

type SingleEncoderType = (i: ParsedInstruction) => Uint8Array;
type EncoderType = {[key: string]: SingleEncoderType};

export const encoder: EncoderType = {
    ld: (i: ParsedInstruction) => pack(emitLoad(i, 4, false)),
    ldh: (i: ParsedInstruction) => pack(emitLoad(i, 2, false)),
    ldb: (i: ParsedInstruction) => pack(emitLoad(i, 1, false)),
};


// FIXME: Assumes big-endian.
export const pack = (u: c.UnpackedInstruction) => {
    const encoded = new Uint8Array(8);

    encoded[0] = (u.opcode >> 8) & 0xff;
    encoded[1] = u.opcode & 0xff;
    encoded[2] = u.jt & 0xff;
    encoded[3] = u.jf & 0xff;
    encoded[4] = (u.k >> 24) & 0xff;
    encoded[5] = (u.k >> 16) & 0xff;
    encoded[6] = (u.k >> 8) & 0xff;
    encoded[7] = u.k & 0xff;
    return encoded;
};
