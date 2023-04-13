/*
 * Copyright 2023 Andrew Jenkins <andrewjjenkins@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as c from "./consts";
import { ResolvedInstruction } from "./symbols";

export const pack = (u: c.UnpackedInstruction) => {
    const encoded = new Uint8Array(8);

    encoded[0] = u.opcode & 0xff;
    encoded[1] = ((u.src & 0x0f) << 4) | (u.dst & 0x0f);
    encoded[2] = u.offset & 0xff;
    encoded[3] = (u.offset >> 8) & 0xff;
    encoded[7] = (u.imm >> 24) & 0xff;
    encoded[6] = (u.imm >> 16) & 0xff;
    encoded[5] = (u.imm >> 8) & 0xff;
    encoded[4] = u.imm & 0xff;
    return encoded;
};

const packer = (f: Emitter) => {
    return (i: ResolvedInstruction): Uint8Array => {
        return pack(f(i));
    };
};

type SingleEncoder = (i: ResolvedInstruction) => Uint8Array;
type Encoder = { [key: string]: SingleEncoder };
type Emitter = (i: ResolvedInstruction) => c.UnpackedInstruction;
type Validator = (i: ResolvedInstruction) => void;

const encodeRegister = (r: string): number => {
    if (r === "") {
        // r0 and "" (no register) are both represented by 0.
        // The opcode indicates whether the dest/source field has significance.
        return 0;
    }
    if (r[0] !== "r") {
        throw new Error(`Unexpected register name ${r}`);
    }
    return parseInt(r.slice(1));
};


const assertImmediateZero: Validator = (i) => {
    if (i.imm !== BigInt(0)) {
        throw new Error(`Immediate is ${i.imm}, should be 0 for ${i.opname}`);
    }
};
const assertOffsetZero: Validator = (i) => {
    if (i.offset !== 0) {
        throw new Error(`Offset is ${i.imm}, should be 0 for ${i.opname}`);
    }
};
const assertNoSource: Validator = (i) => {
    if (i.source !== "") {
        throw new Error(`Source register is ${i.source}, should not be specified for ${i.opname}`);
    }
};
const assertNoDest: Validator = (i) => {
    if (i.dest !== "") {
        throw new Error(`Dest register is ${i.dest}, should not be specified for ${i.opname}`);
    }
};
const assert32BitImmediate: Validator = (i) => {
    if (i.imm > c.BIG_MAX_32) {
        throw new Error(`Immediate ${i.imm} too large for ${i.opname}`);
    }
};


const loadxEmitter = (size: c.InstructionOpSize) => {
    const emitter: Emitter = (i) => {
        assertImmediateZero(i);
        const unpacked: c.UnpackedInstruction = {
            opcode: c.InstructionClass.EBPF_CLS_LDX | size | c.InstructionOpMode.EBPF_MODE_MEM,
            dst: encodeRegister(i.dest),
            src: encodeRegister(i.source),
            offset: i.offset,
            imm: 0,
        };
        return unpacked;
    };
    return emitter;
};

const lddw = (i: ResolvedInstruction) => {
    assertOffsetZero(i);
    assertNoSource(i);
    const immLow = Number(i.imm & c.BIG_MAX_32);
    const immHigh = Number((i.imm >> BigInt(32)) & c.BIG_MAX_32);
    const unpacked: c.UnpackedInstruction[] = [{
        opcode: c.InstructionClass.EBPF_CLS_LD | c.InstructionOpSize.EBPF_SIZE_DW | c.InstructionOpMode.EBPF_MODE_IMM,
        dst: encodeRegister(i.dest),
        src: 0,
        offset: 0,
        imm: immLow,
    }, {
        opcode: 0,
        dst: 0,
        src: 0,
        offset: 0,
        imm: immHigh,
    }];
    const bytesAry: Uint8Array[] = unpacked.map(pack);
    const bytes = new Uint8Array(16);
    for (let j = 0; j < bytesAry.length; j++) {
        for (let i = 0; i < bytesAry[j].byteLength; i++) {
            bytes[j * 8 + i] = bytesAry[j][i];
        }
    }
    return bytes;
};

const storeSizeMax: { [key in keyof typeof c.InstructionOpSize]: bigint } = {
    EBPF_SIZE_B: BigInt("0xff"),
    EBPF_SIZE_H: BigInt("0xffff"),
    EBPF_SIZE_W: BigInt("0xffffffff"),
    // Yes, stdw can only take a 32-bit imm, and zeros out the high bits
    // of its target.  This is different than lddw.
    EBPF_SIZE_DW: BigInt("0xffffffff"),
};

const storeBaseEmitter = (size: c.InstructionOpSize, cls: c.InstructionClass) => {
    const emitter: Emitter = (i) => {
        if (cls === c.InstructionClass.EBPF_CLS_ST) {
            assertNoSource(i);
            if (i.imm > storeSizeMax[size]) {
                throw new Error(`Immediate ${i.imm} too large for ${i.opname}`);
            }
        } else {
            assertImmediateZero(i);
        }
        const unpacked: c.UnpackedInstruction = {
            opcode: cls | size | c.InstructionOpMode.EBPF_MODE_MEM,
            dst: encodeRegister(i.dest),
            src: encodeRegister(i.source),
            offset: i.offset,
            imm: Number(i.imm),
        };
        return unpacked;
    };
    return emitter;
};
const storeEmitter = (size: c.InstructionOpSize) => storeBaseEmitter(size, c.InstructionClass.EBPF_CLS_ST);
const storexEmitter = (size: c.InstructionOpSize) => storeBaseEmitter(size, c.InstructionClass.EBPF_CLS_STX);

// Typescript needs some convincing that we can convert a string into an enum key
const opnameToInstructionOp = (opname: string) => {
    let aluOpcodeLookup = "EBPF_" + opname.toUpperCase();
    if (aluOpcodeLookup.endsWith("32")) {
        aluOpcodeLookup = aluOpcodeLookup.slice(0, -2);
    }
    const opcode = c.InstructionOp[aluOpcodeLookup as keyof typeof c.InstructionOp];
    if (opcode === undefined) {
        throw new Error(`Unknown ALU op ${opname}`);
    }
    return opcode;
};

const aluBaseEmitter = (cls: c.InstructionClass) => {
    const emitter: Emitter = (i) => {
        assertOffsetZero(i);
        if (i.opname === "neg" || i.opname === "neg32") {
            assertNoSource(i);
        }
        const sourceOperand = (i.source === "") ? c.InstructionSource.EBPF_SRC_IMM : c.InstructionSource.EBPF_SRC_REG;
        if (sourceOperand === c.InstructionSource.EBPF_SRC_IMM) {
            assert32BitImmediate(i);
        } else {
            assertImmediateZero(i);
        }
        if (i.opname.endsWith("32")) {
            if (cls !== c.InstructionClass.EBPF_CLS_ALU) {
                // This is probably not the user's fault, but it's still invalid.
                throw new Error(`Cannot use 32-bit opcode for 64-bit ALU operation`);
            }
        } else {
            if (cls !== c.InstructionClass.EBPF_CLS_ALU64) {
                // This is probably not the user's fault, but it's still invalid.
                throw new Error(`Cannot use 64-bit opcode for 32-bit ALU operation`);
            }
        }
        const aluOpcode = opnameToInstructionOp(i.opname);
        const unpacked: c.UnpackedInstruction = {
            opcode: cls | sourceOperand | aluOpcode,
            dst: encodeRegister(i.dest),
            src: encodeRegister(i.source),
            offset: 0,
            imm: Number(i.imm),
        }
        return unpacked;
    };
    return emitter;
};
const alu32 = packer(aluBaseEmitter(c.InstructionClass.EBPF_CLS_ALU));
const alu64 = packer(aluBaseEmitter(c.InstructionClass.EBPF_CLS_ALU64));


const endianEmitter = (e: c.InstructionEndianness, bits: number) => {
    if ([16, 32, 64].indexOf(bits) === -1) {
        throw new Error(`Bits must be 16, 32, or 64, not ${bits}`);
    }
    const emitter: Emitter = (i) => {
        assertNoSource(i);
        assertOffsetZero(i);
        const unpacked: c.UnpackedInstruction = {
            opcode: c.InstructionClass.EBPF_CLS_ALU | c.InstructionOp.EBPF_ENDIAN | e,
            dst: encodeRegister(i.dest),
            src: 0,
            offset: 0,
            imm: bits,
        };
        return unpacked;
    }
    return emitter;
};

// Typescript needs some convincing that we can convert a string into an enum key
const opnameToJumpOp = (opname: string) => {
    let jumpOpcodeLookup = "EBPF_" + opname.toUpperCase();
    if (jumpOpcodeLookup.endsWith("32")) {
        jumpOpcodeLookup = jumpOpcodeLookup.slice(0, -2);
    }
    if (jumpOpcodeLookup === "jneq") {
        // jneq is a synonym for jne
        jumpOpcodeLookup = "jne";
    }
    const opcode = c.InstructionJumps[jumpOpcodeLookup as keyof typeof c.InstructionJumps];
    if (opcode === undefined) {
        throw new Error(`Unknown jump op ${opname}`);
    }
    return opcode;
};

const jumpBaseEmitter = (cls: c.InstructionClass) => {
    const emitter: Emitter = (i) => {
        if (i.opname === "ja" || i.opname === "exit") {
            assertNoDest(i);
            assertNoSource(i);
            assertImmediateZero(i);
        } else if (i.opname === "call") {
            assertNoDest(i);
            assertNoSource(i);
        }
        const sourceOperand = (i.source === "") ? c.InstructionSource.EBPF_SRC_IMM : c.InstructionSource.EBPF_SRC_REG;
        if (sourceOperand === c.InstructionSource.EBPF_SRC_IMM) {
            assert32BitImmediate(i);
        } else {
            assertImmediateZero(i);
        }
        const jumpOp: c.InstructionJumps = opnameToJumpOp(i.opname);

        const unpacked: c.UnpackedInstruction = {
            opcode: cls | sourceOperand | jumpOp,
            dst: encodeRegister(i.dest),
            src: encodeRegister(i.source),
            offset: i.offset,
            imm: Number(i.imm),
        };
        return unpacked;
    };
    return emitter;
}
const jump32 = packer(jumpBaseEmitter(c.InstructionClass.EBPF_CLS_JMP32));
const jump64 = packer(jumpBaseEmitter(c.InstructionClass.EBPF_CLS_JMP));

export const encoder: Encoder = {
    lddw: lddw,
    ldxdw: packer(loadxEmitter(c.InstructionOpSize.EBPF_SIZE_DW)),
    ldxw: packer(loadxEmitter(c.InstructionOpSize.EBPF_SIZE_W)),
    ldxh: packer(loadxEmitter(c.InstructionOpSize.EBPF_SIZE_H)),
    ldxb: packer(loadxEmitter(c.InstructionOpSize.EBPF_SIZE_B)),
    stb: packer(storeEmitter(c.InstructionOpSize.EBPF_SIZE_B)),
    sth: packer(storeEmitter(c.InstructionOpSize.EBPF_SIZE_H)),
    stw: packer(storeEmitter(c.InstructionOpSize.EBPF_SIZE_W)),
    stdw: packer(storeEmitter(c.InstructionOpSize.EBPF_SIZE_DW)),
    stxb: packer(storexEmitter(c.InstructionOpSize.EBPF_SIZE_B)),
    stxh: packer(storexEmitter(c.InstructionOpSize.EBPF_SIZE_H)),
    stxw: packer(storexEmitter(c.InstructionOpSize.EBPF_SIZE_W)),
    stxdw: packer(storexEmitter(c.InstructionOpSize.EBPF_SIZE_DW)),
    add: alu64,
    sub: alu64,
    mul: alu64,
    div: alu64,
    or: alu64,
    and: alu64,
    lsh: alu64,
    rsh: alu64,
    neg: alu64,
    mod: alu64,
    xor: alu64,
    mov: alu64,
    arsh: alu64,
    add32: alu32,
    sub32: alu32,
    mul32: alu32,
    div32: alu32,
    or32: alu32,
    and32: alu32,
    lsh32: alu32,
    rsh32: alu32,
    neg32: alu32,
    mod32: alu32,
    xor32: alu32,
    mov32: alu32,
    arsh32: alu32,
    le16: packer(endianEmitter(c.InstructionEndianness.EBPF_ENDIAN_LE, 16)),
    le32: packer(endianEmitter(c.InstructionEndianness.EBPF_ENDIAN_LE, 32)),
    le64: packer(endianEmitter(c.InstructionEndianness.EBPF_ENDIAN_LE, 64)),
    be16: packer(endianEmitter(c.InstructionEndianness.EBPF_ENDIAN_BE, 16)),
    be32: packer(endianEmitter(c.InstructionEndianness.EBPF_ENDIAN_BE, 32)),
    be64: packer(endianEmitter(c.InstructionEndianness.EBPF_ENDIAN_BE, 64)),
    ja: jump64,
    jeq: jump64,
    jgt: jump64,
    jge: jump64,
    jlt: jump64,
    jle: jump64,
    jset: jump64,
    jne: jump64,
    jsgt: jump64,
    jsge: jump64,
    jslt: jump64,
    jsle: jump64,
    // there is no ja32, ja takes no arguments.
    jeq32: jump32,
    jgt32: jump32,
    jge32: jump32,
    jlt32: jump32,
    jle32: jump32,
    jset32: jump32,
    jne32: jump32,
    jsgt32: jump32,
    jsge32: jump32,
    jslt32: jump32,
    jsle32: jump32,
    call: jump64,
    exit: jump64,

    // FIXME: ldabs, ldindx
};
