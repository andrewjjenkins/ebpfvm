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
import {disassemble} from '../disassemble';

const FORKTOP_BYTECODE_HEX = `
7913680000000000
b701000000000000
631af0ff00000000
0703000018050000
bfa1000000000000
07010000f0ffffff
b702000004000000
8500000004000000
61a1f0ff00000000
6701000020000000
c701000020000000
7b1af8ff00000000
1811000004000000
0000000000000000
bfa2000000000000
07020000f8ffffff
8500000001000000
1500040000000000
7901000000000000
0701000001000000
7b10000000000000
05000a0000000000
b701000001000000
7b1af0ff00000000
1811000004000000
0000000000000000
bfa2000000000000
07020000f8ffffff
bfa3000000000000
07030000f0ffffff
b704000001000000
8500000002000000
b700000000000000
9500000000000000
`;

/*
const FORKTOP_BYTECODE_HEX = `
bf13000000000000
7936680000000000
7937700000000000
b7010000723a2025
631af8ff00000000
b708000064000000
6b8afcff00000000
bfa1000000000000
07010000f8ffffff
b702000006000000
8500000006000000
b7010000633a2025
631af8ff00000000
6b8afcff00000000
bfa1000000000000
07010000f8ffffff
b702000006000000
bf73000000000000
8500000006000000
6b8afcff00000000
b7010000703a2025
631af8ff00000000
bfa1000000000000
07010000f8ffffff
b702000006000000
bf63000000000000
8500000006000000
b701000000000000
631af0ff00000000
0706000018050000
bfa1000000000000
07010000f0ffffff
b702000004000000
bf63000000000000
8500000004000000
61a1f0ff00000000
6701000020000000
c701000020000000
7b1af8ff00000000
1811000004000000
0000000000000000
bfa2000000000000
07020000f8ffffff
8500000001000000
1500040000000000
7901000000000000
0701000001000000
7b10000000000000
05000a0000000000
b701000001000000
7b1af0ff00000000
1811000004000000
0000000000000000
bfa2000000000000
07020000f8ffffff
bfa3000000000000
07030000f0ffffff
b704000001000000
8500000002000000
b700000000000000
9500000000000000
`;
*/

const FORKTOP_DISASSEMBLED = `\
ldxdw r3, [r1+104]
mov r1, 0
stxw [r10-16], r1
add r3, 1304
mov r1, r10
add r1, -16
mov r2, 4
call probe_read
ldxw r1, [r10-16]
lsh r1, 32
arsh r1, 32
stxdw [r10-8], r1
lddw r1, 4
mov r2, r10
add r2, -8
call map_lookup_elem
jeq r0, 0, +4
ldxdw r1, [r0]
add r1, 1
stxdw [r0], r1
ja +10
mov r1, 1
stxdw [r10-16], r1
lddw r1, 4
mov r2, r10
add r2, -8
mov r3, r10
add r3, -16
mov r4, 1
call map_update_elem
mov r0, 0
exit`;

it('disassembles jeq', () => {
    const instBytecode = new Uint8Array([
       0x15, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    expect(disassemble(instBytecode)).toEqual(["jeq r0, 0, +4"]);
});

it('disassembles forktop', () => {
  const forktop_bytecode = Uint8Array.from(
      Buffer.from(FORKTOP_BYTECODE_HEX.split('\n').join('').trim(), 'hex'));
  const disassembled = disassemble(forktop_bytecode);
  expect(disassembled).toEqual(FORKTOP_DISASSEMBLED.trim().split('\n'));
});
