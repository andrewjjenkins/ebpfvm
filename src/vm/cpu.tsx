export class Cpu {
    programCounter: Uint16Array;
    registers: BigInt64Array;

    constructor(programCounter: Uint16Array, registers: BigInt64Array) {
        this.programCounter = programCounter;
        this.registers = registers;
    }
}
