import { assemble } from '../program';

it("assembles", () => {
    const p = assemble(
        ["ldh [12]",],
        {},
    );

    expect(p.instructions.length).toEqual(1);
    const inst = p.instructions[0];
    expect(inst).toMatchObject({
        asmSource: "ldh [12]",
        machineCode: new Uint8Array([
            0x00, 0x28, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x0c,
        ]),
    });
});

it("assembles a small program", () => {
    const p = assemble(
        [
            "ldh [12]",
            "ldi #4000111",
            "ld  [%x + 40]",
            "ret #0",
            "ret a",
         ],
         {},
    );

    expect(p.instructions.length).toEqual(5);
    expect(p.instructions).toMatchObject([
        {
            asmSource: "ldh [12]",
            machineCode: new Uint8Array([
                0x00, 0x28, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x0c,
            ]),
        }, {
            asmSource: "ldi #4000111",
            machineCode: new Uint8Array([
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x3d, 0x09, 0x6f,
            ]),
        }, {
            asmSource: "ld  [%x + 40]",
            machineCode: new Uint8Array([
                0x00, 0x48, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x28,
            ]),
        }, {
            asmSource: "ret #0",
            machineCode: new Uint8Array([
                0x00, 0x06, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
            ])
        }, {
            asmSource: "ret a",
            machineCode: new Uint8Array([
                0x00, 0x16, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
            ])
        },
    ]);
});

const assemblesSingle =
(instruction: string, expectedMachineCode: Uint8Array) => {
    return () => {
        const p = assemble([instruction], {});
        expect(p.instructions.length).toEqual(1);
        expect(p.instructions[0]).toMatchObject({
            asmSource: instruction,
            machineCode: expectedMachineCode,
        });
    };
};

const rejectsInvalid = (instruction: string) => {
    return () => {
        expect(() => assemble([instruction], {})).toThrow();
    };
};

it("assembles ldb", assemblesSingle(
    "ldb [0x17]",
    new Uint8Array([0x00, 0x30, 0x00, 0x00, 0x00, 0x00, 0x00, 0x17]),
));

it("assembles ld (memory)", assemblesSingle(
    "ld M[0x10]",
    new Uint8Array([0x00, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10]),
));

it("rejects ldb with invalid mode", rejectsInvalid("ldb 0x17"));

it("assembles ldxi", assemblesSingle(
    "ldxi #0x47",
    new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x47]),
));

it("assembles ldxb", assemblesSingle(
    "ldxb 4*([14]&0xf)",
    new Uint8Array([0x00, 0xb1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0e]),
));

it("assembles ldx (4x mode)", assemblesSingle(
    "ldx 4*([14]&0xf)",
    new Uint8Array([0x00, 0xb1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0e]),
));

//FIXME
xit("assembles ldx (extension)", assemblesSingle(
    "ldx len",
    new Uint8Array([0x00, 0xb1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0e]),
));

it("rejects ldxi with invalid mode", rejectsInvalid("ldxi [0x17]"));

it("assembles st", assemblesSingle(
    "st M[0x10]",
    new Uint8Array([0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10]),
));

it("assembles stx", assemblesSingle(
    "stx M[0x10]",
    new Uint8Array([0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10]),
));

