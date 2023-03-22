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
            opName = source === c.InstructionEndianness.EBPF_ENDIAN_BE ? "be" : "le";
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
