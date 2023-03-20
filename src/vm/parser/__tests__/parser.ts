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
import { InstructionOpMode } from '../../consts';
import { parse } from '../parser';

const expectSingleInstruction = (prog: string, expectedInstruction: any) => {
   const parsed = parse(prog);
   expect(parsed.instructions.length).toEqual(1);
   const expected = {
    lineNumber: 1,
    ...expectedInstruction,
   }
   expect(parsed.instructions[0]).toMatchObject(expected);
}

it("parses", () => expectSingleInstruction(
    "stxw [r10], r1\n",
    {
        opname: "stxw",
        source: "r1",
        dest: "r10",
        offset: 0,
        imm: BigInt(0),
    },
));

it("parses with label", () => {
    const parsed = parse("foo: stxw [r10 - 8], r1\n");
    expect(parsed.instructions.length).toEqual(1);
    const expected = {
        lineNumber: 1,
        opname: "stxw",
        source: "r1",
        dest: "r10",
        offset: -8,
        imm: BigInt(0),
    };
    expect(parsed.instructions[0]).toMatchObject(expected);
    expect(parsed.labels).toMatchObject({"foo": 0});
});

it("parses with negative offset", () => expectSingleInstruction(
    "stxw [r10 - 8], r1\n",
    {
        opname: "stxw",
        source: "r1",
        dest: "r10",
        offset: -8,
        imm: BigInt(0),
    },
));

it("parses with positive offset", () => expectSingleInstruction(
    "stxw [r10 + 16], r1\n",
    {
        opname: "stxw",
        source: "r1",
        dest: "r10",
        offset: 16,
        imm: BigInt(0),
    },
));

it("parses with hexadecimal offset", () => expectSingleInstruction(
    "stxw [r10 - 0x0a], r1\n",
    {
        opname: "stxw",
        source: "r1",
        dest: "r10",
        offset: -10,
        imm: BigInt(0),
    },
));

it("parses with percent-labeled registers", () => expectSingleInstruction(
    "stxw [%r10], %r1\n",
    {
        opname: "stxw",
        source: "r1",
        dest: "r10",
        offset: 0,
        imm: BigInt(0),
    },
));

it("parses stdw", () => expectSingleInstruction(
    "stdw [r3-16], 0xab\n",
    {
        opname: "stdw",
        dest: "r3",
        offset: -16,
        imm: BigInt(0xab),
    },
));

it("parses stdw decimal", () => expectSingleInstruction(
    "stdw [r3], 123\n",
    {
        opname: "stdw",
        dest: "r3",
        offset: 0,
        imm: BigInt(123),
    },
));

it("parses stb", () => expectSingleInstruction(
    "stb [r3], 0x123\n",
    {
        opname: "stb",
        dest: "r3",
        offset: 0,
        imm: BigInt(0x123),
    },
));

it("parses lddw", () => expectSingleInstruction(
    "lddw r4, 123456\n",
    {
        opname: "lddw",
        dest: "r4",
        offset: 0,
        imm: BigInt(123456),
    },
));

it("parses large lddw", () => expectSingleInstruction(
    "lddw r4, 0x1122334455667788\n",
    {
        opname: "lddw",
        dest: "r4",
        offset: 0,
        imm: BigInt("0x1122334455667788"),
    },
));

it("parses large lddw with hash", () => expectSingleInstruction(
    "lddw r4, #0x1122334455667788\n",
    {
        opname: "lddw",
        dest: "r4",
        offset: 0,
        imm: BigInt("0x1122334455667788"),
    },
));

it("parses ldxh", () => expectSingleInstruction(
    "ldxh r2, [r0]\n",
    {
        opname: "ldxh",
        source: "r0",
        dest: "r2",
        offset: 0,
        imm: BigInt(0),
    },
));

it("parses ldxh with offset", () => expectSingleInstruction(
    "ldxh r2, [r0 + 14]\n",
    {
        opname: "ldxh",
        source: "r0",
        dest: "r2",
        offset: 14,
        imm: BigInt(0),
    },
));

it("parses ldxb with hex offset", () => expectSingleInstruction(
    "ldxb r4, [r0 + 0x14]\n",
    {
        opname: "ldxb",
        source: "r0",
        dest: "r4",
        offset: 0x14,
        imm: BigInt(0),
    },
));

it("parses ldxb with offset", () => expectSingleInstruction(
    "ldxw r4, [r0 - 14]\n",
    {
        opname: "ldxw",
        source: "r0",
        dest: "r4",
        offset: -14,
        imm: BigInt(0),
    },
));

it("parses ldxdw with offset", () => expectSingleInstruction(
    "ldxdw r0, [r2 + 200]\n",
    {
        opname: "ldxdw",
        source: "r2",
        dest: "r0",
        offset: 200,
        imm: BigInt(0),
    },
));

it("parses ja", () => expectSingleInstruction(
    "ja +32767\n",
    {
        opname: "ja",
        source: "",
        dest: "",
        offset: 32767,
        imm: BigInt(0),
    },
));

it("parses jeq", () => expectSingleInstruction(
    "jeq r7, 0xb, +4\n",
    {
        opname: "jeq",
        source: "",
        dest: "r7",
        offset: 4,
        imm: BigInt(0xb),
    },
));

it("parses jgt", () => expectSingleInstruction(
    "jgt r7, 0xb, +4\n",
    {
        opname: "jgt",
        source: "",
        dest: "r7",
        offset: 4,
        imm: BigInt(0xb),
    },
));

it("parses jge", () => expectSingleInstruction(
    "jge r7, r4, +4\n",
    {
        opname: "jge",
        source: "r4",
        dest: "r7",
        offset: 4,
        imm: BigInt(0),
    },
));

it("parses jlt", () => expectSingleInstruction(
    "jlt r7, r4, +4\n",
    {
        opname: "jlt",
        source: "r4",
        dest: "r7",
        offset: 4,
        imm: BigInt(0),
    },
));

it("parses jle", () => expectSingleInstruction(
    "jle r3, 101, +4\n",
    {
        opname: "jle",
        source: "",
        dest: "r3",
        offset: 4,
        imm: BigInt(101),
    },
));

it("parses jset", () => expectSingleInstruction(
    "jset r3, r4, -4\n",
    {
        opname: "jset",
        source: "r4",
        dest: "r3",
        offset: -4,
        imm: BigInt(0),
    },
));

it("parses jne", () => expectSingleInstruction(
    "jne r3, 40, +20\n",
    {
        opname: "jne",
        source: "",
        dest: "r3",
        offset: 20,
        imm: BigInt(40),
    },
));

// jneq is a synonym for jne
it("parses jneq", () => expectSingleInstruction(
    "jneq r3, 40, +20\n",
    {
        opname: "jne",
        source: "",
        dest: "r3",
        offset: 20,
        imm: BigInt(40),
    },
));

it("parses jsgt", () => expectSingleInstruction(
    "jsgt r3, 40, +20\n",
    {
        opname: "jsgt",
        source: "",
        dest: "r3",
        offset: 20,
        imm: BigInt(40),
    },
));

it("parses jsge", () => expectSingleInstruction(
    "jsge r3, r0, +20\n",
    {
        opname: "jsge",
        source: "r0",
        dest: "r3",
        offset: 20,
        imm: BigInt(0),
    },
));

it("parses jslt", () => expectSingleInstruction(
    "jslt r3, r0, +20\n",
    {
        opname: "jslt",
        source: "r0",
        dest: "r3",
        offset: 20,
        imm: BigInt(0),
    },
));

it("parses jsle", () => expectSingleInstruction(
    "jsle r2, 0x44, +20\n",
    {
        opname: "jsle",
        source: "",
        dest: "r2",
        offset: 20,
        imm: BigInt(0x44),
    },
));

it("parses jsle32", () => expectSingleInstruction(
    "jsle32 r2, 0x44, +20\n",
    {
        opname: "jsle32",
        source: "",
        dest: "r2",
        offset: 20,
        imm: BigInt(0x44),
    },
));

it("parses call immediate", () => expectSingleInstruction(
    "call 6\n",
    {
        opname: "call",
        imm: BigInt(6),
    },
));

it("parses call immediate", () => expectSingleInstruction(
    "call 0x06\n",
    {
        opname: "call",
        imm: BigInt(6),
    },
));

it("parses call label", () => expectSingleInstruction(
    "call trace_printk\n",
    {
        opname: "call",
        label: "trace_printk",
    },
));

it("parses exit", () => expectSingleInstruction(
    "exit\n",
    {
        opname: "exit",
        source: "",
        dest: "",
        offset: 0,
        imm: BigInt(0),
    },
));

it("parses add immediate", () => expectSingleInstruction(
    "add r0, 23\n",
    {
        opname: "add",
        source: "",
        dest: "r0",
        offset: 0,
        imm: BigInt(23),
    },
));

it("parses add register", () => expectSingleInstruction(
    "add r0, r4\n",
    {
        opname: "add",
        source: "r4",
        dest: "r0",
        offset: 0,
        imm: BigInt(0),
    },
));

it("parses alu", () => {
    [ "sub", "mul", "div", "or", "and", "lsh", "rsh", "mod", "xor", "mov", "arsh"].forEach((op: string) => {
        expectSingleInstruction(
            `${op} r0, 23\n`,
            {
                opname: op,
                source: "",
                dest: "r0",
                offset: 0,
                imm: BigInt(23),
            }
        );
    });
});

it("parses neg", () => expectSingleInstruction(
    "neg r4\n",
    {
        opname: "neg",
        source: "",
        dest: "r4",
        offset: 0,
        imm: BigInt(0),
    },
));

it("rejects neg with immediate", () => 
    expect(() => parse("neg r4, 1234\n")).toThrow()
);

it("rejects neg with register", () => 
    expect(() => parse("neg r4, r10\n")).toThrow()
);

it("parses alu32", () => {
    [ "add", "sub", "mul", "div", "or", "and", "lsh", "rsh", "mod", "xor", "mov", "arsh"].forEach((op: string) => {
        expectSingleInstruction(
            `${op}32 r0, 23\n`,
            {
                opname: op + "32",
                source: "",
                dest: "r0",
                offset: 0,
                imm: BigInt(23),
            }
        );
    });
});

it("parses neg32", () => expectSingleInstruction(
    "neg32 r4\n",
    {
        opname: "neg32",
        source: "",
        dest: "r4",
        offset: 0,
        imm: BigInt(0),
    },
));

it("rejects neg32 with immediate", () => 
    expect(() => parse("neg32 r4, 1234\n")).toThrow()
);

it("rejects neg32 with register", () => 
    expect(() => parse("neg32 r4, r10\n")).toThrow()
);

it("rejects ja32", () =>
    expect(() => parse("ja32\n")).toThrow()
);

it("rejects ja with register", () =>
    expect(() => parse("ja r0\n")).toThrow()
);


it("parses endians", () => {
    ["le16", "le32", "le64", "be16", "be32", "be64"].forEach((op: string) => {
        expectSingleInstruction(`${op} r2\n`, {
            opname: op,
            source: "",
            dest: "r2",
            offset: 0,
            imm: BigInt(0),
        });
    });
});


it("ignores comments", () => expectSingleInstruction(
    "// This is a comment\n"+
    "ldxh %r2, [%r4 + 0x12]\n"+
    "// This is another comment\n",
    {
        lineNumber: 2,
        opname: "ldxh",
        source: "r4",
        dest: "r2",
        offset: 0x12,
        imm: BigInt(0),
    },
));

it("is not overgreedy on comments", () =>
  expect(() => parse("/ This is not a valid comment")).toThrow()
)

it("parses a small program without labels", () => {
    const parsed = parse(
        "mov r1, 663916\n" +
        "stxw [r10 - 8], r1\n" +
        "lddw r1,7809632219628990316\n" +
        "stxdw [r10-16],r1\n" +
        "lddw r1, 7160568898002116896\n" +
        "stxdw [%r10+24], r1\n" +
        "exit\n"
    );
    expect(parsed.instructions.length).toEqual(7);
});

it("rejects duplicate labels", () =>
  expect(() => parse(
    "mov r1, 663916\n" +
    "drop: exit\n" +
    "drop: exit\n"
  )).toThrow()
);
