import { OperandsModes } from '../consts';
import { parse } from '../parser';

const expectSingleInstruction = (prog: string, expectedInstruction) => {
   const instructions = parse(prog);
   expect(instructions.length).toEqual(1);
   expect(instructions[0]).toMatchObject(expectedInstruction);
}

it("parses", () => expectSingleInstruction(
    "ldh [x + 12]\n",
    {
        opcode: "ldh",
        mode: OperandsModes.PacketOffset,
        register: "x",
        offset: 12,
    },
));

it("parses hex addresses", () => expectSingleInstruction(
  "ldh [x + 0x12]\n",
  {
    opcode: "ldh",
    mode: OperandsModes.PacketOffset,
    register: "x",
    offset: 18,
  },
));

it("parses percent registers", () => expectSingleInstruction(
  "ldh [%x + 0x12]\n",
  {
    opcode: "ldh",
    mode: OperandsModes.PacketOffset,
    register: "x",
    offset: 18,
  },
));

it("ignores comments", () => expectSingleInstruction(
    "// This is a comment\n"+
    "ldh [%x + 0x12]\n"+
    "// This is another comment\n",
    {
        opcode: "ldh",
        mode: OperandsModes.PacketOffset,
        register: "x",
        offset: 18,
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
        offset: 14,
    },
));

it("parses ldi", () => expectSingleInstruction(
    "ldi #0x47\n",
    {
        opcode: "ldi",
        mode: OperandsModes.Immediate,
        offset: 0x47,
    },
));


it("parses ld", () => expectSingleInstruction(
    "ld [14]\n",
    {
        opcode: "ld",
        mode: OperandsModes.Packet,
        offset: 14,
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
        offset: 40,
    },
));

it("parses ldxi", () => expectSingleInstruction(
    "ldxi #400\n",
    {
        opcode: "ldxi",
        mode: OperandsModes.Immediate,
        offset: 400,
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
        offset: 32,
    },
));

it("parses ldxb with whitespace (fourx mode)", () => expectSingleInstruction(
    "ldxb 4 * ([32] & 0xf )\n",
    {
        opcode: "ldxb",
        mode: OperandsModes.FourXPacketNibble,
        offset: 32,
    },
));

it("parses jmp", () => expectSingleInstruction(
    "jmp foobar\n",
    {
        opcode: "jmp",
        mode: OperandsModes.Label,
        label: "foobar",
    },
));

it("parses ja", () => expectSingleInstruction(
    "ja foobar\n",
    {
        opcode: "ja",
        mode: OperandsModes.Label,
        label: "foobar",
    },
));

it("parses jeq (immediate, T+F)", () => expectSingleInstruction(
    "jeq #1, foo, bar\n",
    {
        opcode: "jeq",
        mode: OperandsModes.JumpTFImmediate,
        true: "foo",
        false: "bar",
        offset: 1,
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
        offset: 1,
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
        offset: 0,
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
        offset: 0x42,
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

it("parses ret (immediate)", () => expectSingleInstruction(
    "ret #42\n",
    {
        opcode: "ret",
        mode: OperandsModes.Immediate,
        offset: 42,
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
    const instructions = parse(
        "ldh [12]\n" +
        "jne #0x806, drop\n" +
        "ret #1\n" +
        "ret #0\n"
    );
    expect(instructions.length).toEqual(4);
})

xit("parses a small program", () => {
    const instructions = parse(
        "ldh [12]\n" +
        "jne #0x806, drop\n" +
        "ret #-1\n" +
        "drop: ret #0\n"
    );
    expect(instructions.length).toEqual(4);
})

