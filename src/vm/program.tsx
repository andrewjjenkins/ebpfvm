
export interface Instruction {
    // The assembly version of this instruction, like:
    // 'fooLabel:   jeq #ETHERTYPE_IP, L1, L2',
    asmSource: string;

    machineCode: Uint8Array;
}

export type LabelsToAddress = {[label: string]: number};

export class Program {
    labels: LabelsToAddress;
    instructions: Instruction[];

    constructor() {
        this.labels = {};
        this.instructions = [];
    }

    loadProgramFromAsmSource(asmSource: string[]) {
        //FIXME: May need to do a run to locate labels.

        asmSource.forEach((asmSourceLine, i) => {
            const inst: Instruction = {
                asmSource: asmSourceLine,
                machineCode: new Uint8Array(8),
            };
            // FIXME: Set the machine code.
            // FIXME: If this instruction is labeled, set it.

            this.instructions.push(inst);
        });
    }
}

export const newProgramFromAsmSource = (asmSource: string[]) => {
    const program = new Program();
    program.loadProgramFromAsmSource(asmSource);
    return program;
}
