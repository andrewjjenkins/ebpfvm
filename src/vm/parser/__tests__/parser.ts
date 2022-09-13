import { OperandsModes } from '../consts';
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
    "ldh [x + 12]\n",
    {
        opcode: "ldh",
        mode: OperandsModes.PacketOffset,
        register: "x",
        k: 12,
    },
));

it("parses hex addresses", () => expectSingleInstruction(
  "ldh [x + 0x12]\n",
  {
    opcode: "ldh",
    mode: OperandsModes.PacketOffset,
    register: "x",
    k: 18,
  },
));

it("parses percent registers", () => expectSingleInstruction(
  "ldh [%x + 0x12]\n",
  {
    opcode: "ldh",
    mode: OperandsModes.PacketOffset,
    register: "x",
    k: 18,
  },
));

it("ignores comments", () => expectSingleInstruction(
    "// This is a comment\n"+
    "ldh [%x + 0x12]\n"+
    "// This is another comment\n",
    {
        lineNumber: 2,
        opcode: "ldh",
        mode: OperandsModes.PacketOffset,
        register: "x",
        k: 18,
    },
));

it("is not overgreedy on comments", () =>
  expect(() => parse("/ This is not a valid comment")).toThrow()
)

it("parses ldb", () => expectSingleInstruction(
    "ldb [14]\n",
    {
        opcode: "ldb",
        mode: OperandsModes.Packet,
        k: 14,
    },
));

it("parses ldi", () => expectSingleInstruction(
    "ldi #0x47\n",
    {
        opcode: "ldi",
        mode: OperandsModes.Immediate,
        k: 0x47,
    },
));


it("parses ld", () => expectSingleInstruction(
    "ld [14]\n",
    {
        opcode: "ld",
        mode: OperandsModes.Packet,
        k: 14,
    },
));

it("parses ld (extension)", () => expectSingleInstruction(
    "ld len\n",
    {
        opcode: "ld",
        mode: OperandsModes.Extension,
        extension: "len",
    },
));

it("parses ldx", () => expectSingleInstruction(
    "ldx M[40]\n",
    {
        opcode: "ldx",
        mode: OperandsModes.Memory,
        k: 40,
    },
));

it("parses ldxi", () => expectSingleInstruction(
    "ldxi #400\n",
    {
        opcode: "ldxi",
        mode: OperandsModes.Immediate,
        k: 400,
    },
));

it("rejects ldxi with invalid mode", () =>
  expect(() => parse("ldxi [40]\n")).toThrow()
);

it("parses ldxb (fourx mode)", () => expectSingleInstruction(
    "ldxb 4*([32]&0xf)\n",
    {
        opcode: "ldxb",
        mode: OperandsModes.FourXPacketNibble,
        k: 32,
    },
));

it("parses ldxb with whitespace (fourx mode)", () => expectSingleInstruction(
    "ldxb 4 * ([32] & 0xf )\n",
    {
        opcode: "ldxb",
        mode: OperandsModes.FourXPacketNibble,
        k: 32,
    },
));

it("parses st", () => expectSingleInstruction(
    "st M[0x10]\n",
    {
        opcode: "st",
        mode: OperandsModes.Memory,
        k: 0x10,
    },
));


it("parses jmp", () => expectSingleInstruction(
    "jmp foobar\n",
    {
        opcode: "jmp",
        mode: OperandsModes.Label,
        true: "foobar",
    },
));

it("parses ja", () => expectSingleInstruction(
    "ja foobar\n",
    {
        opcode: "ja",
        mode: OperandsModes.Label,
        true: "foobar",
    },
));

it("parses jeq (immediate, T+F)", () => expectSingleInstruction(
    "jeq #1, foo, bar\n",
    {
        opcode: "jeq",
        mode: OperandsModes.JumpTFImmediate,
        true: "foo",
        false: "bar",
        k: 1,
    },
));

it("parses jeq (register, T+F)", () => expectSingleInstruction(
    "jeq %x, foo, bar\n",
    {
        opcode: "jeq",
        mode: OperandsModes.JumpTFRegister,
        true: "foo",
        false: "bar",
        register: "x",
    },
));

it("parses jeq (immediate, T only)", () => expectSingleInstruction(
    "jeq #1, foo\n",
    {
        opcode: "jeq",
        mode: OperandsModes.JumpImmediate,
        true: "foo",
        k: 1,
    },
));

it("parses jeq (register, T only)", () => expectSingleInstruction(
    "jeq x, foo\n",
    {
        opcode: "jeq",
        mode: OperandsModes.JumpRegister,
        true: "foo",
        register: "x",
    },
));

it("parses jneq (immediate)", () => expectSingleInstruction(
    "jneq #0, foo\n",
    {
        opcode: "jneq",
        mode: OperandsModes.JumpImmediate,
        true: "foo",
        k: 0,
    },
));

it("parses jneq (register)", () => expectSingleInstruction(
    "jneq %x, foo\n",
    {
        opcode: "jneq",
        mode: OperandsModes.JumpRegister,
        true: "foo",
        register: "x",
    },
));

it("parses jne (register)", () => expectSingleInstruction(
    "jne %x, foo\n",
    {
        opcode: "jne",
        mode: OperandsModes.JumpRegister,
        true: "foo",
        register: "x",
    },
));

it("parses jlt (register)", () => expectSingleInstruction(
    "jlt %x, foo\n",
    {
        opcode: "jlt",
        mode: OperandsModes.JumpRegister,
        true: "foo",
        register: "x",
    },
));

it("parses jle (register)", () => expectSingleInstruction(
    "jle %x, foo\n",
    {
        opcode: "jle",
        mode: OperandsModes.JumpRegister,
        true: "foo",
        register: "x",
    },
));

it("parses jgt (immediate, T+F)", () => expectSingleInstruction(
    "jgt #0x42, foo, bar\n",
    {
        opcode: "jgt",
        mode: OperandsModes.JumpTFImmediate,
        true: "foo",
        false: "bar",
        k: 0x42,
    },
));

it("parses jge (register, T+F)", () => expectSingleInstruction(
    "jge x, foo, bar\n",
    {
        opcode: "jge",
        mode: OperandsModes.JumpTFRegister,
        true: "foo",
        false: "bar",
        register: "x",
    },
));

it("parses jset (register, T only)", () => expectSingleInstruction(
    "jset x, foo\n",
    {
        opcode: "jset",
        mode: OperandsModes.JumpRegister,
        true: "foo",
        register: "x",
    },
));

it("parses add", () => expectSingleInstruction(
    "add x\n",
    {
        opcode: "add",
        mode: OperandsModes.Register,
        register: "x",
    },
));

it("parses sub", () => expectSingleInstruction(
    "sub #14\n",
    {
        opcode: "sub",
        mode: OperandsModes.Immediate,
        k: 14,
    },
));

it("parses mul", () => expectSingleInstruction(
    "mul #14\n",
    {
        opcode: "mul",
        mode: OperandsModes.Immediate,
        k: 14,
    },
));

it("parses div", () => expectSingleInstruction(
    "div x\n",
    {
        opcode: "div",
        mode: OperandsModes.Register,
        register: "x",
    },
));

it("parses mod", () => expectSingleInstruction(
    "mod x\n",
    {
        opcode: "mod",
        mode: OperandsModes.Register,
        register: "x",
    },
));

it("parses neg", () => expectSingleInstruction(
    "neg\n",
    {
        opcode: "neg",
        mode: OperandsModes.Immediate,
    },
));

it("rejects neg with an argument", () =>
  expect(() => parse("neg x\n")).toThrow()
);

it("parses and", () => expectSingleInstruction(
    "and x\n",
    {
        opcode: "and",
        mode: OperandsModes.Register,
        register: "x",
    },
));

it("parses or", () => expectSingleInstruction(
    "or x\n",
    {
        opcode: "or",
        mode: OperandsModes.Register,
        register: "x",
    },
));

it("parses xor", () => expectSingleInstruction(
    "xor x\n",
    {
        opcode: "xor",
        mode: OperandsModes.Register,
        register: "x",
    },
));

it("parses lsh", () => expectSingleInstruction(
    "lsh #4\n",
    {
        opcode: "lsh",
        mode: OperandsModes.Immediate,
        k: 4,
    },
));

it("parses rsh", () => expectSingleInstruction(
    "rsh #3\n",
    {
        opcode: "rsh",
        mode: OperandsModes.Immediate,
        k: 3,
    },
));

it("parses ret (immediate)", () => expectSingleInstruction(
    "ret #42\n",
    {
        opcode: "ret",
        mode: OperandsModes.Immediate,
        k: 42,
    },
));

it("parses ret (accumulator)", () => expectSingleInstruction(
    "ret a\n",
    {
        opcode: "ret",
        mode: OperandsModes.Accumulator,
    },
));

it("parses ret (accumulator, with percent)", () => expectSingleInstruction(
    "ret %a\n",
    {
        opcode: "ret",
        mode: OperandsModes.Accumulator,
    },
));

it("parses a small program without labels", () => {
    const parsed = parse(
        "ldh [12]\n" +
        "jne #0x806, drop\n" +
        "ret #1\n" +
        "ret #0\n"
    );
    expect(parsed.instructions.length).toEqual(4);
});

it("parses a small program", () => {
    const parsed = parse(
        "ldh [12]\n" +
        "jne #0x806, drop\n" +
        "ret #1\n" +
        "drop: ret #0\n"
    );
    expect(parsed.labels).toMatchObject({
        "drop": 3
    })
    expect(parsed.instructions.length).toEqual(4);
    expect(parsed.instructions).toMatchObject([
        {
            opcode: "ldh",
            mode: OperandsModes.Packet,
            k: 12,
        }, {
            opcode: "jne",
            mode: OperandsModes.JumpImmediate,
            k: 0x806,
            true: "drop",
        }, {
            opcode: "ret",
            mode: OperandsModes.Immediate,
            k: 1,
        }, {
            opcode: "ret",
            mode: OperandsModes.Immediate,
            k: 0,
        },
    ]);
});

it("rejects duplicate labels", () =>
  expect(() => parse(
    "ldh [12]\n" +
    "drop: ret #0\n" +
    "drop: ret #1\n"
  )).toThrow()
);

it("parses negative immediates", () => expectSingleInstruction(
  "ldi #-12\n",
  {
    opcode: "ldi",
    mode: OperandsModes.Immediate,
    k: -12,
  },
));
