export class Memory {
    mem: Uint8Array;

    constructor(size: number) {
        this.mem = new Uint8Array(size);
    }

    replace(m: Uint8Array) {
        this.mem = m;
    }
}

const max = (a: number, b: number) => (a > b) ? a : b;

export const newMemoryFromString = (init: string, minSize?: number) => {
    const m = new Memory(0);
    minSize = minSize || 0;

    let x = new Uint8Array(max(init.length, minSize));
    for (let i = 0; i < init.length; i++) {
            x[i] = init.charCodeAt(i);
    }
    m.replace(x);

    return m;
};
