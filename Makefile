UBPF_C = ubpf/ubpf_jit_x86_64.c ubpf/ubpf_vm.c ubpf/ebpfvm_emscripten.c
UBPF_H = ubpf/ubpf_int.h ubpf/ebpf.h ubpf/ubpf_jit_x86_64.h ubpf/inc/ubpf.h ubpf/inc/ubpf_config.h
UBPF_DEPS= $(UBPF_C) $(UBPF_H)

all: build

public/ubpf.wasm: build_vm/ubpf.wasm
	cp build_vm/ubpf.wasm public/ubpf.wasm

src/generated/ubpf.js: build_vm/ubpf.wasm
	mkdir -p src/generated/
	cp build_vm/ubpf.js src/generated/ubpf.js

# This target produces both ubpf.wasm and ubpf.js
build_vm/ubpf.wasm: $(UBPF_DEPS) emsdk/upstream/emscripten/emcc
	mkdir -p build_vm/ src/generated/
	/bin/bash -c "\
		cd emsdk && . emsdk_env.sh && cd ../ && \
		emcc -g -O0 -s RESERVED_FUNCTION_POINTERS=100 -s EXPORTED_RUNTIME_METHODS=addFunction,UTF8ToString -s MODULARIZE=1 -s ENVIRONMENT="web" -Wbad-function-cast -Wcast-function-type -D__x86_64__=1 -Iubpf/inc -o build_vm/ubpf.js $(UBPF_C) \
	"
	sed -i '1 i\ /* eslint-disable */' build_vm/ubpf.js

src/generated/ebpf-assembler.js: src/vm/parser/ebpf.jison
	npm run build-parser

start: public/ubpf.wasm src/generated/ubpf.js src/generated/ebpf-assembler.js
	npm start

build: public/ubpf.wasm src/generated/ubpf.js src/generated/ebpf-assembler.js
	npm run build

emsdk/upstream/emscripten/emcc:
	mkdir -p emsdk
	curl -o emsdk/emsdk-3.1.32.tar.gz -L https://github.com/emscripten-core/emsdk/archive/refs/tags/3.1.32.tar.gz
	tar -C emsdk --strip-components=1 -xzf emsdk/emsdk-3.1.32.tar.gz
	cd emsdk/ && ./emsdk install 3.1.32 && ./emsdk activate 3.1.32

clean:
	rm -rf build/ build_vm/ src/generated/ public/ubpf.wasm
	mkdir -p build/ build_vm/ src/generated/

# Also removes large-download build tools (emscripten)
super-clean: clean
	rm -rf emsdk
	mkdir -p emsdk/

.PHONY: all start build clean super-clean
