import * as c from "./consts";
import { OperandsModes } from "./parser/consts";
import { ResolvedInstruction } from "./symbols";

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
        case OperandsModes.Packet:
        case OperandsModes.Memory:
        case OperandsModes.Immediate:
        case OperandsModes.FourXPacketNibble:
        case OperandsModes.Label:
        case OperandsModes.JumpImmediate:
        case OperandsModes.JumpTFImmediate:
        case OperandsModes.Extension:
            return c.InstructionSource.BPF_K;
        case OperandsModes.PacketOffset:
        case OperandsModes.JumpRegister:
        case OperandsModes.JumpTFRegister:
            return c.InstructionSource.BPF_X;
        case OperandsModes.Accumulator:
            return c.InstructionSource.BPF_A;
        default:
            throw new Error(`Unimplemented mode: ${m}`);
    }
}

const emitLoadBase = (i: ResolvedInstruction, numBytes: number, loadClass: c.InstructionClass): c.UnpackedInstruction => {
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

const emitLoad = (i: ResolvedInstruction, numBytes: number) =>
    emitLoadBase(i, numBytes, c.InstructionClass.BPF_LD);
const emitLoadx = (i: ResolvedInstruction, numBytes: number) =>
    emitLoadBase(i, numBytes, c.InstructionClass.BPF_LDX);

const emitStoreBase = (i: ResolvedInstruction, storeClass: c.InstructionClass) => {
    if (i.k === undefined) {
        throw new Error(`store: missing target`);
    }
    return {
        opcode: storeClass,
        jt: 0,
        jf: 0,
        k: i.k,
    }
};

const emitStore = (i: ResolvedInstruction) =>
    emitStoreBase(i, c.InstructionClass.BPF_ST);
const emitStorex = (i: ResolvedInstruction) =>
    emitStoreBase(i, c.InstructionClass.BPF_STX);

const emitJumpBase = (i: ResolvedInstruction, jumpType: c.InstructionJumps) => {
    const encodedSource = modeToSource(i.mode);
    const opcode = c.InstructionClass.BPF_JMP | jumpType | encodedSource;

    switch (i.mode) {
        case OperandsModes.Label:
            if (i.true === undefined) {
                throw new Error(`jump: no target`);
            }
            return {
                opcode,
                jt: 0,
                jf: 0,
                k: i.true
            };

        case OperandsModes.JumpTFRegister:
            if (i.register !== "x") {
                throw new Error(`jump: unknown register ${i.register}`);
            }
            if (i.true === undefined || i.false == undefined) {
                throw new Error(`jump: missing target`);
            }
            return {
                opcode,
                jt: i.true,
                jf: i.false,
                k: 0,
            };

        case OperandsModes.JumpTFImmediate:
            if (i.k === undefined) {
                throw new Error(`jump: missing comparand`);
            }
            if (i.true === undefined || i.false == undefined) {
                throw new Error(`jump: missing target`);
            }
            return {
                opcode,
                jt: i.true,
                jf: i.false,
                k: i.k,
            };

        case OperandsModes.JumpRegister:
            if (i.register !== "x") {
                throw new Error(`jump: unknown register ${i.register}`);
            }
            if (i.true === undefined) {
                throw new Error(`jump: missing target`);
            }
            return {
                opcode,
                jt: i.true,
                jf: 0,
                k: 0,
            };

        case OperandsModes.JumpImmediate:
            if (i.k === undefined) {
                throw new Error(`jump: missing comparand`);
            }
            if (i.true === undefined) {
                throw new Error(`jump: missing target`);
            }
            return {
                opcode,
                jt: i.true,
                jf: 0,
                k: i.k,
            };

        default:
            throw new Error(`jump: unimplemented`);
    }
};

// Mnemonics like "jne" are just "jeq" with true/false swapped.
const swapTF = (i: c.UnpackedInstruction) => {
    return {
        ...i,
        jt: i.jf,
        jf: i.jt,
    };
};

const emitJump = (i: ResolvedInstruction) => emitJumpBase(i, c.InstructionJumps.BPF_JA);
const emitJeq = (i: ResolvedInstruction) => emitJumpBase(i, c.InstructionJumps.BPF_JEQ);
const emitJgt = (i: ResolvedInstruction) => emitJumpBase(i, c.InstructionJumps.BPF_JGT);
const emitJge = (i: ResolvedInstruction) => emitJumpBase(i, c.InstructionJumps.BPF_JGE);
const emitJset = (i: ResolvedInstruction) => emitJumpBase(i, c.InstructionJumps.BPF_JSET);

const emitRet = (i: ResolvedInstruction): c.UnpackedInstruction => {
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

type SingleEncoderType = (i: ResolvedInstruction) => Uint8Array;
type EncoderType = {[key: string]: SingleEncoderType};

export const encoder: EncoderType = {
    ld: (i: ResolvedInstruction) => pack(emitLoad(i, 4)),
    ldh: (i: ResolvedInstruction) => pack(emitLoad(i, 2)),
    ldb: (i: ResolvedInstruction) => pack(emitLoad(i, 1)),
    ldi: (i: ResolvedInstruction) => pack(emitLoad(i, 4)),
    ldx: (i: ResolvedInstruction) => pack(emitLoadx(i, 4)),
    ldxi: (i: ResolvedInstruction) => pack(emitLoadx(i, 4)),
    ldxb: (i: ResolvedInstruction) => pack(emitLoadx(i, 1)),
    st: (i: ResolvedInstruction) => pack(emitStore(i)),
    stx: (i: ResolvedInstruction) => pack(emitStorex(i)),
    jmp: (i: ResolvedInstruction) => pack(emitJump(i)),
    ja: (i: ResolvedInstruction) => pack(emitJump(i)),
    jeq: (i: ResolvedInstruction) => pack(emitJeq(i)),
    jne: (i: ResolvedInstruction) => pack(swapTF(emitJeq(i))),
    jneq: (i: ResolvedInstruction) => pack(swapTF(emitJeq(i))),
    jlt: (i: ResolvedInstruction) => pack(swapTF(emitJge(i))),
    jle: (i: ResolvedInstruction) => pack(swapTF(emitJgt(i))),
    jgt: (i: ResolvedInstruction) => pack(emitJgt(i)),
    jge: (i: ResolvedInstruction) => pack(emitJge(i)),
    jset: (i: ResolvedInstruction) => pack(emitJset(i)),
    ret: (i: ResolvedInstruction) => pack(emitRet(i)),
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
