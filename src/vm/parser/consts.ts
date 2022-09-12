// These are the addressing modes from
// https://www.kernel.org/doc/Documentation/networking/filter.txt
export enum OperandsModes {
    Register, // Mode 0
    Packet,
    PacketOffset,
    Memory,
    Immediate,
    FourXPacketNibble,
    Label,
    JumpTFImmediate,
    JumpTFRegister,
    JumpImmediate,
    JumpRegister,
    Accumulator,
    Extension, // Mode 12
}
