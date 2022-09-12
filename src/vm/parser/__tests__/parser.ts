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

