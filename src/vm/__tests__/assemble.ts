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
import { assemble } from '../program';
import { HELLOWORLD_HEXBYTECODE, HELLOWORLD_SOURCE } from '../consts';

it("assembles", () => {
    const p = assemble(
        ["ldxw r1, [r2]",],
        {},
    );

    expect(p.instructions.length).toEqual(1);
    const inst = p.instructions[0];
    expect(inst).toMatchObject({
        asmSource: "ldxw r1, [r2]",
        machineCode: new Uint8Array([
            0x61, 0x21, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
        ]),
    });
});

it("assembles a small program", () => {
    const p = assemble(
        [
            "ldxw r0, [r2]",
            "lddw r1, 0x6C616320656E6F6C",
            "stxdw [r10-16], r1",
            //"call trace_printk",
            "mov r1, 663916",
            "add r1, r10",
            "exit",
         ],
         {},
    );

    expect(p.instructions.length).toEqual(6);
    expect(p.instructions[0].machineCode.byteLength).toEqual(8);
    expect(p.instructions[1].machineCode.byteLength).toEqual(16); // lddw
    expect(p.instructions[2].machineCode.byteLength).toEqual(8);
    expect(p.instructions[3].machineCode.byteLength).toEqual(8);
    expect(p.instructions[4].machineCode.byteLength).toEqual(8);
    expect(p.instructions[5].machineCode.byteLength).toEqual(8);
    expect(p.instructions).toMatchObject([
        {
            asmSource: "ldxw r0, [r2]",
            machineCode: new Uint8Array([
                0x61, 0x20, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
            ]),
        }, {
            asmSource: "lddw r1, 0x6C616320656E6F6C",
            machineCode: new Uint8Array([
                0x18, 0x01, 0x00, 0x00,
                0x6c, 0x6f, 0x6e, 0x65,
                0x00, 0x00, 0x00, 0x00,
                0x20, 0x63, 0x61, 0x6c,
            ]),
        }, {
            asmSource: "stxdw [r10-16], r1",
            machineCode: new Uint8Array([
                0x7b, 0x1a, 0xf0, 0xff,
                0x00, 0x00, 0x00, 0x00,
            ]),
        }, {
            asmSource: "mov r1, 663916",
            machineCode: new Uint8Array([
                0xb7, 0x01, 0x00, 0x00,
                0x6c, 0x21, 0x0a, 0x00,
            ]),
        }, {
            asmSource: "add r1, r10",
            machineCode: new Uint8Array([
                0x0f, 0xa1, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
            ]),
        }, {
            asmSource: "exit",
            machineCode: new Uint8Array([
                0x95, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
            ]),
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

it("assembles add reg, negative imm", assemblesSingle(
    "add r1, -48",
    new Uint8Array([
        0x07, 0x01, 0x00, 0x00,
        0xd0, 0xff, 0xff, 0xff,
    ]),
));

it("assembles add reg, positive imm", assemblesSingle(
    "add r1, +48",
    new Uint8Array([
        0x07, 0x01, 0x00, 0x00,
        0x30, 0x00, 0x00, 0x00,
    ]),
));

it("assembles add reg, imm", assemblesSingle(
    "add r1, 48",
    new Uint8Array([
        0x07, 0x01, 0x00, 0x00,
        0x30, 0x00, 0x00, 0x00,
    ]),
));

it("assembles add reg, reg", assemblesSingle(
    "add r1, r10",
    new Uint8Array([
        0x0f, 0xa1, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
    ]),
));

it("assembles le16", assemblesSingle(
    "le16 r3",
    new Uint8Array([
        0xd4, 0x03, 0x00, 0x00,
        0x10, 0x00, 0x00, 0x00,
    ]),
));

it("assembles le32", assemblesSingle(
    "le32 r3",
    new Uint8Array([
        0xd4, 0x03, 0x00, 0x00,
        0x20, 0x00, 0x00, 0x00,
    ]),
));

it("assembles le64", assemblesSingle(
    "le64 r3",
    new Uint8Array([
        0xd4, 0x03, 0x00, 0x00,
        0x40, 0x00, 0x00, 0x00,
    ]),
));

it("assembles be16", assemblesSingle(
    "be16 r3",
    new Uint8Array([
        0xdc, 0x03, 0x00, 0x00,
        0x10, 0x00, 0x00, 0x00,
    ]),
));

it("assembles be32", assemblesSingle(
    "be32 r3",
    new Uint8Array([
        0xdc, 0x03, 0x00, 0x00,
        0x20, 0x00, 0x00, 0x00,
    ]),
));

it("assembles be64", assemblesSingle(
    "be64 r3",
    new Uint8Array([
        0xdc, 0x03, 0x00, 0x00,
        0x40, 0x00, 0x00, 0x00,
    ]),
));

it("assembles ja", assemblesSingle(
    "ja +32",
    new Uint8Array([
        0x05, 0x00, 0x20, 0x00,
        0x00, 0x00, 0x00, 0x00,
    ]),
));

it("assembles jeq reg-reg", assemblesSingle(
    "jeq r1, r7, +40",
    new Uint8Array([
        0x1d, 0x71, 0x28, 0x00,
        0x00, 0x00, 0x00, 0x00,
    ]),
));

it("assembles jeq reg-imm", assemblesSingle(
    "jeq r1, 447, +40",
    new Uint8Array([
        0x15, 0x01, 0x28, 0x00,
        0xbf, 0x01, 0x00, 0x00,
    ]),
));

it("assembles jeq reg-imm", assemblesSingle(
    "jeq32 r1, 447, +40",
    new Uint8Array([
        0x16, 0x01, 0x28, 0x00,
        0xbf, 0x01, 0x00, 0x00,
    ]),
));

it("assembles call 6", assemblesSingle(
    "call 6",
    new Uint8Array([
        0x85, 0x00, 0x00, 0x00,
        0x06, 0x00, 0x00, 0x00,
    ]),
));

it("assembles exit", assemblesSingle(
    "exit",
    new Uint8Array([
        0x95, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
    ]),
));

it("assembles Hello World", () => {
    const lines = HELLOWORLD_SOURCE.split('\n');
    const p = assemble(
        lines,
        {},
    );

    expect(p.instructions.length).toEqual(lines.length);

    let byteCodeOffset = 0;
    for (let i = 0; i < p.instructions.length; i++) {
        const inst = p.instructions[i];
        for (let j = 0; j < inst.machineCode.byteLength; j++) {
            const expectedOffset = byteCodeOffset + j;
            const expectedHexByte = parseInt(HELLOWORLD_HEXBYTECODE.slice(expectedOffset * 2, expectedOffset * 2 + 2), 16);
            if (inst.machineCode[j] !== expectedHexByte) {
                // FIXME: A more elegant way of getting to jest "fail()"
                console.error(`Machine code mismatch at byte ${j} of instruction ${i} ` +
                    `(bytecode ${expectedOffset}); found ${inst.machineCode[j]}, ` +
                    `expected ${expectedHexByte}`);
                expect(true).toBe(false);
            }
        }
        byteCodeOffset += inst.machineCode.byteLength
    }
});

it("assembles with comments and blank lines", () => {
    // a comment line, a blank line, and an instruction
    const source = "// foo\n\nmov r1, 40";
    const p = assemble(source.split('\n'), {});
    expect(p.instructions.length).toEqual(1);
    expect(p.instructions[0]).toMatchObject({
        asmSource: source,
        machineCode: new Uint8Array([
            0xb7, 0x01, 0x00, 0x00,
            0x28, 0x00, 0x00, 0x00,
        ]),
    });
});

it("assembles with trailing and blank lines", () => {
    // a comment line, a blank line, and an instruction
    const source = "mov r1, 40\n// foo\n\n";
    const p = assemble(source.split('\n'), {});
    expect(p.instructions.length).toEqual(1);
    expect(p.instructions[0]).toMatchObject({
        asmSource: source,
        machineCode: new Uint8Array([
            0xb7, 0x01, 0x00, 0x00,
            0x28, 0x00, 0x00, 0x00,
        ]),
    });
});

/*
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

const assemblesJump = (instruction: string, expectedEncoded: Uint8Array) => {
    return () => {
        const p = assemble([
            instruction,
            "ld #42",
            "bar: ret #-1",
            "foo: ret #0",
        ], {});

        expect(p.instructions.length).toBe(4);
        expect(p.instructions[0]).toMatchObject({
            asmSource: instruction,
            machineCode: expectedEncoded,
        });
    };
};

it("assembles jmp", assemblesJump(
    "jmp foo",
    new Uint8Array([0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02]),
));

it("assembles ja", assemblesJump(
    "ja foo",
    new Uint8Array([0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02]),
));

it("assembles jeq (true only)", assemblesJump(
    "jeq #42, foo",
    new Uint8Array([0x00, 0x15, 0x02, 0x00, 0x00, 0x00, 0x00, 0x2a]),
));

it("assembles jeq (true/false)", assemblesJump(
    "jeq #42, foo, bar",
    new Uint8Array([0x00, 0x15, 0x02, 0x01, 0x00, 0x00, 0x00, 0x2a]),
));

it("assembles jne", assemblesJump(
    "jne #42, foo",
    new Uint8Array([0x00, 0x15, 0x00, 0x02, 0x00, 0x00, 0x00, 0x2a]),
));

it("assembles jneq", assemblesJump(
    "jneq #42, foo",
    new Uint8Array([0x00, 0x15, 0x00, 0x02, 0x00, 0x00, 0x00, 0x2a]),
));

const rejectsJump = (instruction: string) => {
    return () => {
        expect(() => {
            const p = assemble([
                instruction,
                "ld #42",
                "bar: ret #-1",
                "foo: ret #0",
            ], {});
        }).toThrow();
    };
};

it("rejects jneq (true/false)", rejectsJump("jneq #42, foo, bar"));

it("assembles jlt", assemblesJump(
    "jlt #42, foo",
    new Uint8Array([0x00, 0x35, 0x00, 0x02, 0x00, 0x00, 0x00, 0x2a]),
));

it("rejects jlt (true/false)", rejectsJump("jlt #42, foo, bar"));

it("assembles jle", assemblesJump(
    "jle #42, foo",
    new Uint8Array([0x00, 0x25, 0x00, 0x02, 0x00, 0x00, 0x00, 0x2a]),
));

it("assembles jgt (true only)", assemblesJump(
    "jgt #42, foo",
    new Uint8Array([0x00, 0x25, 0x02, 0x00, 0x00, 0x00, 0x00, 0x2a]),
));

it("assembles jgt (true/false)", assemblesJump(
    "jgt #42, foo, bar",
    new Uint8Array([0x00, 0x25, 0x02, 0x01, 0x00, 0x00, 0x00, 0x2a]),
));

it("assembles jgt (X, true/false)", assemblesJump(
    "jgt %x, foo, bar",
    new Uint8Array([0x00, 0x2d, 0x02, 0x01, 0x00, 0x00, 0x00, 0x00]),
));

it("assembles jge", assemblesJump(
    "jge #42, foo, bar",
    new Uint8Array([0x00, 0x35, 0x02, 0x01, 0x00, 0x00, 0x00, 0x2a]),
));

it("assembles jset", assemblesJump(
    "jset #42, bar",
    new Uint8Array([0x00, 0x45, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2a]),
));

it("assembles example program", () => {
    const p = assemble([
        "ldh [12]",
        "jne #0x806, drop",
        "ret #-1",
        "drop: ret #0",
    ], {});

    expect(p.labels).toMatchObject({"drop": 3});
    expect(p.instructions.length).toEqual(4);
    expect(p.instructions).toMatchObject([
        {
            asmSource: "ldh [12]",
            machineCode: new Uint8Array([
                0x00, 0x28, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0c,
            ]),
        }, {
            asmSource: "jne #0x806, drop",
            machineCode: new Uint8Array([
                0x00, 0x15, 0x00, 0x01, 0x00, 0x00, 0x08, 0x06,
            ]),
        }, {
            asmSource: "ret #-1",
            machineCode: new Uint8Array([
                0x00, 0x06, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff,
            ]),
        }, {
            asmSource: "drop: ret #0",
            machineCode: new Uint8Array([
                0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]),
        },
    ]);
});
*/

