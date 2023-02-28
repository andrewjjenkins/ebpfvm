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

export const HELLOWORLD_HEXBYTECODE =
"b70100006c210a00631af8ff00000000180100006c6f6e65000000002063" +
"616c7b1af0ff0000000018010000206120730000000079735f637b1ae8ff" +
"00000000180100007265204900000000206469647b1ae0ff000000001801" +
"00006f726c6400000000212048657b1ad8ff000000001801000048656c6c" +
"000000006f2c20577b1ad0ff00000000bfa100000000000007010000d0ff" +
"ffffb70200002c0000008500000006000000b70000000000000095000000" +
"00000000";

export enum InstructionClass {
    EBPF_CLS_LD = 0x00,
    EBPF_CLS_LDX = 0x01,
    EBPF_CLS_ST = 0x02,
    EBPF_CLS_STX = 0x03,
    EBPF_CLS_ALU = 0x04,
    EBPF_CLS_JMP = 0x05,
    EBPF_CLS_JMP32 = 0x06,
    EBPF_CLS_ALU64 = 0x07,
}
export const EBPF_CLASS = (x: InstructionClass) => (x & 0x07);

export enum InstructionOpSize {
    EBPF_SIZE_W = 0x00,
    EBPF_SIZE_H = 0x08,
    EBPF_SIZE_B = 0x10,
    EBPF_SIZE_DW = 0x18,
}
export const EBPF_SIZE = (x: InstructionOpSize) => (x & 0x18);

export enum InstructionOpMode {
    EBPF_MODE_IMM = 0x00,
    /*BPF_ABS = 0x20,
    BPF_IND = 0x40,*/
    EBPF_MODE_MEM = 0x60,
}
export const EBPF_MODE = (x: InstructionOpMode) => (x & 0xe0);

export enum InstructionSource {
    EBPF_SRC_IMM = 0x00,
    EBPF_SRC_REG = 0x08,
}
export const EBPF_SRC = (x: InstructionSource) => (x & 0x08);
export enum InstructionOp {
    EBPF_ADD = 0x00,
    EBPF_SUB = 0x10,
    EBPF_MUL = 0x20,
    EBPF_DIV = 0x30,
    EBPF_OR = 0x40,
    EBPF_AND = 0x50,
    EBPF_LSH = 0x60,
    EBPF_RSH = 0x70,
    EBPF_NEG = 0x80,
    EBPF_MOD = 0x90,
    EBPF_XOR = 0xa0,
    EBPF_MOV = 0xb0,
    EBPF_ARSH = 0xc0,
    EBPF_ENDIAN = 0xd0,
}
export const EBPF_OP = (x: InstructionOp) => (x & 0xf0);

export enum InstructionJumps {
    EBPF_JA = 0x00,
    EBPF_JEQ = 0x10,
    EBPF_JGT = 0x20,
    EBPF_JGE = 0x30,
    EBPF_JSET = 0x40,
    EBPF_JNE = 0x50,
    EBPF_JSGT = 0x60,
    EBPF_JSGE = 0x70,
    EBPF_CALL = 0x80,
    EBPF_EXIT = 0x90,
    EBPF_JLT = 0xa0,
    EBPF_JLE = 0xb0,
    EBPF_JSLT = 0xc0,
    EBPF_JSLE = 0xd0,
}

export const OFFSET_MAX = Math.pow(2, 16) - 1;

export interface UnpackedInstruction {
    opcode: number,
    dst: number,
    src: number,
    offset: number,
    imm: number,
}
