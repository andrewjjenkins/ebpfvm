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

