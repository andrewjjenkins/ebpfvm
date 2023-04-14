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

interface memoryConstructorOptions {
    buffer: ArrayBuffer,
    stackOffset: number,
    stackSize: number,
    heapOffset: number,
    heapSize: number,
}

export class Memory {
    all: Uint8Array;
    all32: Uint32Array;
    all64: BigUint64Array;
    stack: Uint8Array;
    heap: Uint8Array;

    constructor(opts: memoryConstructorOptions) {
        this.all = new Uint8Array(opts.buffer);
        const allCount32 = Math.floor(this.all.byteLength / 4);
        this.all32 = new Uint32Array(this.all.buffer, this.all.byteOffset, allCount32);
        const allCount64 = Math.floor(this.all.byteLength / 8);
        this.all64 = new BigUint64Array(this.all.buffer, this.all.byteOffset, allCount64);

        if (opts.stackOffset + opts.stackSize > this.all.byteLength) {
            throw new Error(`Stack size too big (${opts.stackOffset} + ${opts.stackSize} > ${this.all.byteLength})`);
        }
        this.stack = new Uint8Array(this.all.buffer, opts.stackOffset, opts.stackSize);

        if (opts.heapOffset + opts.heapSize > this.all.byteLength) {
            throw new Error(`Stack size too big (${opts.heapOffset} + ${opts.heapSize} > ${this.all.byteLength})`);
        }
        this.heap = new Uint8Array(this.all.buffer, opts.heapOffset, opts.heapSize);

    }
};
