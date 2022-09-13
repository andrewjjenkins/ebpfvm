export const DEFAULT_MEMORY_INIT = "hello world";
export const DEFAULT_MEMORY_MIN_SIZE = 128;

/* FIXME: Use this one once symbols are supported.
export const DEFAULT_PROGRAM = [
    '     ldh [12]',
    '     jeq #ETHERTYPE_IP, L1, L2',
    'L1:  ret #TRUE',
    'L2:  ret #0',
];
*/

export const DEFAULT_PROGRAM = [
    '     ldh [12]',
    '     jeq #0x806, L1, L2',
    'L1:  ret #-1',
    'L2:  ret #0',
];

export enum InstructionClass {
    BPF_LD = 0x00,
    BPF_LDX = 0x01,
    BPF_ST = 0x02,
    BPF_STX = 0x03,
    BPF_ALU = 0x04,
    BPF_JMP = 0x05,
    BPF_RET = 0x06,
    BPF_MISC = 0x07,
}
export const BPF_CLASS = (x: InstructionClass) => (x & 0x07);

/* applicable for ld/ldx */
export enum InstructionOpSize {
    BPF_W = 0x00,
    BPF_H = 0x08,
    BPF_B = 0x10,
}
export const BPF_SIZE = (x: InstructionOpSize) => (x & 0x18);
export enum InstructionOpMode {
    BPF_IMM = 0x00,
    BPF_ABS = 0x20,
    BPF_IND = 0x40,
    BPF_MEM = 0x60,
    BPF_LEN = 0x80,
    BPF_MSH = 0xa0,
}
export const BPF_MODE = (x: InstructionOpMode) => (x & 0xe0);

export enum InstructionOp {
    BPF_ADD = 0x00,
    BPF_SUB = 0x10,
    BPF_MUL = 0x20,
    BPF_DIV = 0x30,
    BPF_OR = 0x40,
    BPF_AND = 0x50,
    BPF_LSH = 0x60,
    BPF_RSH = 0x70,
    BPF_NEG = 0x80,
    BPF_MOD = 0x90,
    BPF_XOR = 0xa0,
}
export const BPF_OP = (x: InstructionOp) => (x & 0xf0);

export enum InstructionJumps {
    BPF_JA = 0x00,
    BPF_JEQ = 0x10,
    BPF_JGT = 0x20,
    BPF_JGE = 0x30,
    BPF_JSET = 0x40,
}

export enum InstructionSource {
    BPF_K = 0x00,
    BPF_X = 0x08,
    BPF_A = 0x10,
}
export const BPF_SRC = (x: InstructionSource) => (x & 0x08);

export const OFFSET_MAX = Math.pow(2, 16) - 1;

export interface UnpackedInstruction {
    opcode: number,
    jt: number,
    jf: number,
    k: number,
}
