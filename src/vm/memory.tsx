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
    buffer: Uint8Array,
    memoryInit?: string,
}

export class Memory {
    mem: Uint8Array;
    mem32: Uint32Array;

    constructor(opts: memoryConstructorOptions) {
        this.mem = opts.buffer;

        const vmCount32 = Math.floor(this.mem.byteLength / 4)
        this.mem32 = new Uint32Array(this.mem.buffer, this.mem.byteOffset, vmCount32);

        if (opts.memoryInit) {
            this.replaceAscii(opts.memoryInit)
        }
    }

    // Inefficient
    replaceAscii(init: string) {
        if (this.mem32 === undefined) {
            throw new Error("replaceAscii but not ready");
        }
        let u8view = new Uint8Array(Math.ceil(init.length / 4) * 4);
        for (let i = 0; i < init.length; i++) {
            u8view[i] = init.charCodeAt(i);
        }
        let u32view = new Uint32Array(u8view.buffer);
        this.mem32.fill(0);
        for (let i = 0; i < u32view.length; i++) {
            this.mem32[i] = u32view[i];
        }
    }
}
