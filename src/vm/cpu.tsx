
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
}
