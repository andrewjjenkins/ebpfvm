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

import binconsts from '../generated/vm/consts';

type Apply =
    (freeMemory: Uint8Array, registers: BigUint64Array) => void;

export interface Entrypoint {
    apply: Apply;
}

const assignMemory =
    (freeMemory: Uint8Array, toAssign: Uint8Array) => {
      if (toAssign.byteLength > freeMemory.byteLength) {
        throw new Error(`Cannot assign ${toAssign.byteLength} bytes; only ${
            freeMemory.byteLength} remaining`);
      }
      freeMemory.set(toAssign);
      const newFreeMemory = new Uint8Array(freeMemory.buffer, freeMemory.byteOffset + toAssign.byteLength, freeMemory.byteLength-toAssign.byteLength);
      return newFreeMemory;
    };

export const CreateSchedCloneEntrypoint =
    (pid: number) => {
      const apply: Apply = (freeMemory, registers) => {
        const taskStructRelAddr = freeMemory.byteOffset;
        freeMemory = assignMemory(freeMemory, binconsts['task_struct']);
        const contextRelAddr = freeMemory.byteOffset;
        freeMemory = assignMemory(freeMemory, binconsts['context']);

        // The second argument (0x68) is a pointer to "struct task_struct"
        const contextAsBiguint = new BigUint64Array(freeMemory.buffer, contextRelAddr, binconsts['context'].byteLength / 8);
        contextAsBiguint[0x68 / 8] = BigInt(taskStructRelAddr);

        // Initialize r1 to point to registers.
        registers[1] = BigInt(contextRelAddr);
      };

      return {apply};
    };

export const SchedCloneEntrypoint = {
  memory: binconsts.task_struct,
};
