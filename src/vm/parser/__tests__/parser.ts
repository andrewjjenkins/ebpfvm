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

it("is not overgreedy on comments", () => {
    expect(() => parse("/ This is not a valid comment")).toThrow();
})
