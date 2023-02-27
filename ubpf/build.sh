#!/usr/bin/env bash
set -euxo pipefail

emcc -g -O0 -s MODULARIZE=1 -s ENVIRONMENT="web" -D__x86_64__=1 -s EXPORTED_FUNCTIONS=_getVmMemory,_getVmMemorySize,_ubpf_create,_ubpf_load,_ubpf_exec,_ubpf_error,_ubpf_destroy -I./inc -o ubpf.js ubpf_vm.c ubpf_jit_x86_64.c ubpf.c
sed -i '1 i\ // @ts-nocheck' ubpf.js
cp ubpf.js ../src/vm/ubpf.js
cp ubpf.wasm ../public/ubpf.wasm

