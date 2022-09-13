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
        case OperandsModes.Memory:
            return c.InstructionOpMode.BPF_MEM;
        case OperandsModes.FourXPacketNibble:
            return c.InstructionOpMode.BPF_MSH;
        default:
            throw new Error(`Unimplemented mode: ${m}`);
    }
};

const modeToSource = (m: OperandsModes): c.InstructionSource => {
    switch (m) {
        case OperandsModes.Immediate:
        case OperandsModes.Packet:
        case OperandsModes.Memory:
        case OperandsModes.FourXPacketNibble:
            return c.InstructionSource.BPF_K;
        case OperandsModes.PacketOffset:
            return c.InstructionSource.BPF_X;
        case OperandsModes.Accumulator:
            return c.InstructionSource.BPF_A;
        default:
            throw new Error(`Unimplemented mode: ${m}`);
    }
}

const emitLoadBase = (i: ParsedInstruction, numBytes: number, loadClass: c.InstructionClass): c.UnpackedInstruction => {
    const loadSize = bytesToOpSize(numBytes);
    const encodedOpmode = modeToOpMode(i.mode);
    const encodedSource = modeToSource(i.mode);
    const opcode = loadClass | loadSize | encodedOpmode |
        encodedSource;

    switch (i.mode) {
        case OperandsModes.Immediate:
        case OperandsModes.Packet:
        case OperandsModes.PacketOffset:
        case OperandsModes.Memory:
            if (i.k === undefined) {
                throw new Error(`Load: no k (offset/immediate)`);
            }
            return {
                opcode,
                jt: 0,
                jf: 0,
                k: i.k,
            };
        case OperandsModes.FourXPacketNibble:
            if (i.k === undefined) {
                throw new Error(`Load: no k (offset)`);
            }
            return {
                // Even if the "ldx" mnemonic is used, this instruction
                // always has byte size.
                opcode: opcode | c.InstructionOpSize.BPF_B,
                jt: 0,
                jf: 0,
                k: i.k,
            }

        case OperandsModes.Extension:
            throw new Error(`Load: unimplemented mode ${i.mode}`);
        default:
            throw new Error(`Load: invalid mode ${i.mode}`);
    }
};

const emitLoad = (i: ParsedInstruction, numBytes: number) =>
    emitLoadBase(i, numBytes, c.InstructionClass.BPF_LD);
const emitLoadx = (i: ParsedInstruction, numBytes: number) =>
    emitLoadBase(i, numBytes, c.InstructionClass.BPF_LDX);

const emitStoreBase = (i: ParsedInstruction, storeClass: c.InstructionClass) => {
    return {
        opcode: storeClass,
        jt: 0,
        jf: 0,
        k: i.k,
    }
};

const emitStore = (i: ParsedInstruction) =>
    emitStoreBase(i, c.InstructionClass.BPF_ST);
const emitStorex = (i: ParsedInstruction) =>
    emitStoreBase(i, c.InstructionClass.BPF_STX);

const emitRet = (i: ParsedInstruction): c.UnpackedInstruction => {
    const source = modeToSource(i.mode);
    const opcode = c.InstructionClass.BPF_RET | source;

    switch (i.mode) {
        case OperandsModes.Immediate:
            if (i.k === undefined) {
                throw new Error(`Ret: no immediate`);
            }
            return {
                opcode,
                jt: 0,
                jf: 0,
                k: i.k,
            };

        case OperandsModes.Accumulator:
            return {
                opcode,
                jt: 0,
                jf: 0,
                k: 0,
            };

        default:
            throw new Error(`ret: invalid mode ${i.mode}`);
    }
};

type SingleEncoderType = (i: ParsedInstruction) => Uint8Array;
type EncoderType = {[key: string]: SingleEncoderType};

export const encoder: EncoderType = {
    ld: (i: ParsedInstruction) => pack(emitLoad(i, 4)),
    ldh: (i: ParsedInstruction) => pack(emitLoad(i, 2)),
    ldb: (i: ParsedInstruction) => pack(emitLoad(i, 1)),
    ldi: (i: ParsedInstruction) => pack(emitLoad(i, 4)),
    ldx: (i: ParsedInstruction) => pack(emitLoadx(i, 4)),
    ldxi: (i: ParsedInstruction) => pack(emitLoadx(i, 4)),
    ldxb: (i: ParsedInstruction) => pack(emitLoadx(i, 1)),
    st: (i: ParsedInstruction) => pack(emitStore(i)),
    stx: (i: ParsedInstruciton) => pack(emitStorex(i)),
    ret: (i: ParsedInstruction) => pack(emitRet(i)),
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
