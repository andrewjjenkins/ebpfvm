#!/usr/bin/env bash
set -euxo pipefail

emcc -g -O0 -s MODULARIZE=1 -s ENVIRONMENT="web" -D__x86_64__=1 -I./inc -o ubpf.js ubpf_vm.c ubpf_jit_x86_64.c ebpfvm_emscripten.c
sed -i '1 i\ /* eslint-disable */' ubpf.js
cp ubpf.js ../src/vm/ubpf.js
cp ubpf.wasm ../public/ubpf.wasm

