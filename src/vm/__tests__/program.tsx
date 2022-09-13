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
            0x00, 0x28,
            0x00,
            0x00,
            0x00, 0x00, 0x00, 0x0c,
        ]),
    });
});
