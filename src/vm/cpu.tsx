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
export class Cpu {
    programCounter: Uint16Array;
    registers: BigUint64Array;
    hotAddress: BigUint64Array;
    hotAddressSize: BigUint64Array;

    constructor(programCounter: Uint16Array, registers: BigUint64Array, hotAddress: BigUint64Array, hotAddressSize: BigUint64Array) {
        this.programCounter = programCounter;
        this.registers = registers;
        this.hotAddress = hotAddress;
        this.hotAddressSize = hotAddressSize;
    }
}
