
import * as c from "./consts";

export class Cpu {
    instructionPointer: number;
    accumulator: number;
    index: number;

    constructor() {
        this.instructionPointer = 0;
        this.accumulator = 0;
        this.index = 0;
    }

    step(inst: Uint8Array, mem: Uint8Array, pkt: Uint8Array) {
        if (inst.length !== 8) {
            throw new Error(`BPF instruction must be 8 bytes (${inst.length})`);
        }

        const instClass = c.BPF_CLASS(inst[0]);
        switch (instClass) {
            case c.InstructionClass.BPF_LD:
                this.doLoad(inst, mem, pkt);
                break;
            case c.InstructionClass.BPF_LDX:
            case c.InstructionClass.BPF_ST:
            case c.InstructionClass.BPF_STX:
            case c.InstructionClass.BPF_ALU:
            case c.InstructionClass.BPF_JMP:
            case c.InstructionClass.BPF_RET:
            case c.InstructionClass.BPF_MISC:
                throw new Error(`Unimplemented instruction class ${instClass}`);
        }
    }

    doLoad(inst: Uint8Array, mem: Uint8Array, pkt: Uint8Array) {
        var toLoad: Uint8Array | undefined;

        const opmode = c.BPF_MODE(inst[0]);
        switch (opmode) {
            case c.InstructionOpMode.BPF_IMM:
                toLoad = inst.slice(4, 4);
                break;
            case c.InstructionOpMode.BPF_ABS:
            case c.InstructionOpMode.BPF_IND:
            case c.InstructionOpMode.BPF_MEM:
            case c.InstructionOpMode.BPF_LEN:
            case c.InstructionOpMode.BPF_MSH:
                throw new Error(`Unimplemented load mode ${opmode}`);
        }

    }
}
