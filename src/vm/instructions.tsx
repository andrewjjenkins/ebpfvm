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

const signedOffset = (code: Uint8Array, offset: number) => {
    const offUnsigned = (code[offset]) | (code[offset + 1] << 8);
    if (offUnsigned >= 32768) {
        return - (65536 - offUnsigned)
    } else {
        return offUnsigned;
    }
};

const stringifyRelative = (base: string, offset: number) => {
    if (offset === 0) {
        return `[${base}]`;
    } else if (offset > 0) {
        return `[${base}+${offset}]`;
    } else {
        return `[${base}${offset}]`;
    }
}

const toImm = (n: number) => {
    // UBPF's disassembler emits "%#12345" but the assembler only
    // accepts "12345".  We'll match the assembler.
    return `${n}`;
};

export const disassembleInstruction = (code: Uint8Array, offset: number) => {
    const instClass = c.EBPF_CLASS(code[offset]);
    const dst_reg = code[offset + 1] & 0xf;
    const src_reg = (code[offset + 1] >> 4) & 0xf;
    const off = signedOffset(code, offset + 2);
    const imm: number = (code[offset + 4] << 0) | (code[offset + 5] << 8) |
        (code[offset + 6] << 16) | (code[offset + 7] << 24);

    if (instClass === c.InstructionClass.EBPF_CLS_ALU || instClass === c.InstructionClass.EBPF_CLS_ALU64) {
        const op = c.EBPF_OP(code[offset]);
        const fullOpName = c.InstructionOp[op];
        let opName = fullOpName.replace(/^EBPF_/, '').toLowerCase();
        if (instClass === c.InstructionClass.EBPF_CLS_ALU) {
            opName += "32";
        }
        const source = c.EBPF_SRC(code[offset]);

        if (op === c.InstructionOp.EBPF_NEG) {
            return `${opName} r${dst_reg}`;
        } else if (op === c.InstructionOp.EBPF_ENDIAN) {
            opName = source === c.InstructionSource.EBPF_SRC_REG ? "be" : "le";
            return `${opName}${imm} r${dst_reg}`;
        } else if (source === 0) {
            return `${opName} r${dst_reg}, ${toImm(imm)}`;
        } else {
            return `${opName} r${dst_reg}, r${src_reg}`;
        }
    } else if (instClass === c.InstructionClass.EBPF_CLS_JMP) {
        const op = c.EBPF_OP(code[offset]);
        const fullOpName = c.InstructionJumps[op];
        let opName = fullOpName.replace(/^EBPF_/, '').toLowerCase();
        const source = c.EBPF_SRC(code[offset]);

        if (op === c.InstructionJumps.EBPF_EXIT) {
            return opName;
        } else if (op === c.InstructionJumps.EBPF_CALL) {
            if (imm < c.EBPF_HELPER_FUNC_NAMES.length) {
                return `${opName} ${c.EBPF_HELPER_FUNC_NAMES[imm]}`;
            } else {
                return `${opName} ${toImm(imm)}`;
            }
        } else if (op === c.InstructionJumps.EBPF_JA) {
            return `${opName} ${offset}`;
        } else if (source === 0) {
            return `${opName} r${dst_reg}, ${toImm(imm)}, ${offset}`;
        } else {
            return `${opName} r${dst_reg}, r${src_reg}, ${offset}`;
        }
    } else if (instClass === c.InstructionClass.EBPF_CLS_JMP32) {
        throw new Error("EBPF_CLS_JMP32 Unimplemented");
    } else if ((instClass & 0xfc) === 0x00) {
        // load or store
        const fullClassName = c.InstructionClass[instClass];
        const className = fullClassName.replace(/^EBPF_CLS_/, '').toLowerCase();
        const size = c.EBPF_SIZE(code[offset]);
        const fullSizeName = c.InstructionOpSize[size];
        let sizeStr = fullSizeName.replace(/^EBPF_SIZE_/, '').toLowerCase();
        const mnem = `${className}${sizeStr}`

        if (instClass === c.InstructionClass.EBPF_CLS_LD && size === c.InstructionOpSize.EBPF_SIZE_DW) {
            // The next "instruction" is actually 4 bytes of 0 and then
            // the high bits of the 64-bit immediate.
            const highImm: number = (code[offset + 12] << 0) | (code[offset + 13] << 8) |
                (code[offset + 14] << 16) | (code[offset + 15] << 24);
            let bigImm = BigInt(highImm);
            bigImm <<= BigInt(32);
            bigImm |= BigInt(imm);
            return `${mnem} r${dst_reg}, ${bigImm}`;
        } else if (code[offset] === 0x00) {
            // This is the second instruction of a previous lddw
            return "";
        } else if (instClass === c.InstructionClass.EBPF_CLS_LDX) {
            const arg2 = stringifyRelative(`r${src_reg}`, off);
            return `${mnem} r${dst_reg}, ${arg2}`;
        } else if (instClass === c.InstructionClass.EBPF_CLS_ST) {
            const arg1 = stringifyRelative(`r${dst_reg}`, off);
            return `${mnem} ${arg1}, ${toImm(imm)}`;
        } else if (instClass === c.InstructionClass.EBPF_CLS_STX) {
            const arg1 = stringifyRelative(`r${dst_reg}`, off);
            return `${mnem} ${arg1}, r${src_reg}`;
        } else {
            throw new Error(`Unknown memory instruction ${code[offset]}`);
        }
    } else {
        throw new Error(`Unknown instruction ${code[offset]}`);
    }
};

export const disassemble = (code: Uint8Array, offset: number, numInsts: number) => {
    const decoded: string[] = [];

    for (let i = 0; i < numInsts; i++) {
        decoded.push(disassembleInstruction(code, offset + 8 * i));
    }
    return decoded;
};

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

const loadxEmitter = (size: c.InstructionOpSize) => {
    const emitter: Emitter = (i) => {
        if (i.imm !== BigInt(0)) {
            throw new Error(`Immediate is ${i.imm}, should be 0 for ${i.opname}`);
        }
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
    if (i.offset !== 0) {
        throw new Error(`Offset is ${i.offset}, should be 0 for lddw`);
    }
    if (i.source !== "") {
        throw new Error(`Source register is ${i.source}, should not be specified for lddw`);
    }
    const immLow = Number(i.imm & BigInt("0xffffffff"));
    const immHigh = Number((i.imm >> BigInt(32)) & BigInt("0xffffffff"));
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
            if (i.source !== "") {
                throw new Error(`Unexpected source (${i.source}) for immediate store`);
            }
            if (i.imm > storeSizeMax[size]) {
                throw new Error(`Immediate ${i.imm} too large for ${i.opname}`);
            }
        } else {
            if (i.imm !== BigInt(0)) {
                throw new Error(`Immediate is ${i.imm}, should be 0 for ${i.opname}`);
            }
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
        if (i.offset !== 0) {
            throw new Error(`Offset is ${i.offset}, should be 0 for ${i.opname}`);
        }
        if ((i.opname === "neg" || i.opname === "neg32") && i.source !== "") {
            throw new Error(`Source is ${i.source}, should be unset for neg/neg32`);
        }
        const sourceOperand = (i.source === "") ? c.InstructionSource.EBPF_SRC_IMM : c.InstructionSource.EBPF_SRC_REG;
        if (sourceOperand === c.InstructionSource.EBPF_SRC_IMM) {
            if (i.imm > BigInt("0xffffffff")) {
                throw new Error(`Immediate ${i.imm} too large for ${i.opname}`);
            }
        } else {
            if (i.imm !== BigInt(0)) {
                    throw new Error(`Immediate is ${i.imm}, should be 0 for register ALU op`);
            }
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


    // FIXME: endian, jumps, ldabs, ldindx

};
