export class Memory {
    mem: Uint8Array;
    mem32: Uint32Array;
    wasmMem: WebAssembly.Memory;

    constructor() {
        this.wasmMem = new WebAssembly.Memory({
            initial: 10,  // 64 KiB pages
            maximum: 100,
        })
        this.mem32 = new Uint32Array(this.wasmMem.buffer);
        this.mem = new Uint8Array(this.wasmMem.buffer);
    }

    // Inefficient
    replaceAscii(init: string) {
        let u8view = new Uint8Array(Math.ceil(init.length / 4) * 4);
        for (let i = 0; i < init.length; i++) {
            u8view[i] = init.charCodeAt(i);
        }
        let u32view = new Uint32Array(u8view.buffer);
        this.mem32.fill(0);
        for (let i =0; i < u32view.length; i++) {
            this.mem32[i] = u32view[i];
        }
    }

    callAdd() {
        WebAssembly.instantiateStreaming(
            fetch("add.wasm"),
            { js: {mem: this.wasmMem} })
        .then(obj => {
            for (let i = 0; i < 10; i++) {
            this.mem[i] = i;
            }
            const sum = (obj as any).instance.exports.accumulate(0, 10);
            console.log(sum);
        });
    }
}

export const newMemoryFromString = (init: string) => {
    const m = new Memory();
    m.replaceAscii(init);
    return m;
};
