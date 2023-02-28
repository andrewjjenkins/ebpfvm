#include <emscripten.h>
#include "ubpf_int.h"
#include <stdio.h>
#include <stdarg.h>
#include <stdint.h>

int error_printf(FILE* stream, const char *format, ...) {
    char errorBuffer[10240];

    va_list argptr;
    va_start(argptr, format);
    int len = vsnprintf(errorBuffer, sizeof(errorBuffer), format, argptr);
    if (len < 0) {
        return len;
    }
    if (len >= sizeof(errorBuffer)) {
        errorBuffer[sizeof(errorBuffer) - 1] = '\0';
        len = sizeof(errorBuffer) - 1;
    }
    EM_ASM({
        console.error("ubpf error: ", UTF8ToString($0));
    }, errorBuffer);
    return len;
}

uint64_t ubpf_default_extension_func(uint64_t a, uint64_t b, uint64_t c, uint64_t d, uint64_t e) {
    EM_ASM({
        console.log("ubpf_default_extension_func(%d, %d, %d, %d, %d)", $0, $1, $2, $3, $4);
    }, a, b, c, d, e);
    return 0;
}

#define VMMEMORY_SIZE 1024
uint8_t vmMemory[VMMEMORY_SIZE];

uint8_t * EMSCRIPTEN_KEEPALIVE getVmMemory() {
    return vmMemory;
}

size_t EMSCRIPTEN_KEEPALIVE getVmMemorySize() {
    return VMMEMORY_SIZE;
}

struct ubpf_vm *vm = NULL;

int EMSCRIPTEN_KEEPALIVE ebpfvm_create_vm() {
    if (vm != NULL) {
        EM_ASM({
            console.error("epbfvm_create_vm(): already created");
        });
        return -1;
    }

    vm = ubpf_create();
    if (vm == NULL) {
        EM_ASM({
            console.error("ebpfvm_create_vm(): failed to create");
        });
        return -1;
    }

    for (unsigned int i = 0; i < 64; i++) {
        if (ubpf_register(vm, i, "ubpf_default_extension_func", ubpf_default_extension_func) < 0) {
            error_printf(NULL, "ebpfvm_create_vm(): failed to register extension func %d", i);
            return -1;
        }
    }

    ubpf_set_pointer_secret(vm, 0);
    ubpf_set_error_print(vm, error_printf);
    return 0;
}

int EMSCRIPTEN_KEEPALIVE ebpfvm_allocate_instructions(int n) {
    int bytes = n * 8;
    if (vm->insts != NULL) {
        error_printf(NULL, "ebpfvm_allocate_instructions(): already allocated");
        return -1;
    }
    vm->insts = malloc(bytes);
    vm->num_insts = n;
    return n;
}

int EMSCRIPTEN_KEEPALIVE ebpfvm_validate_instructions() {
    if (vm->insts == NULL) {
        error_printf(NULL, "ebpfvm_validate_instruction(): no instructions");
        return -1;
    }

    char *errmsg = NULL;
    if (!validate(vm, vm->insts, vm->num_insts, &errmsg)) {
        error_printf(NULL, "ebpfvm_validate_instructions(): %s", errmsg);
        free(errmsg);
        return -1;
    }
    return 0;
}

void * EMSCRIPTEN_KEEPALIVE ebpfvm_get_instructions() {
    if (vm == NULL) {
        return NULL;
    }
    return vm->insts;
}

uint16_t EMSCRIPTEN_KEEPALIVE ebpfvm_get_instructions_count() {
    if (vm == NULL) {
        return 0;
    }
    return vm->num_insts;
}


int EMSCRIPTEN_KEEPALIVE emadd(int start, int n) {
    int sum = 42;
    for (int i = 0; i < n; i++) {
        sum += vmMemory[i];
    }
    return sum;
}

int EMSCRIPTEN_KEEPALIVE ajj_load(int n) {
    struct ubpf_vm *vm = ubpf_create();
    char *errmsg = NULL;
    int rc = ubpf_load(vm, vmMemory, n, &errmsg);
    if (errmsg != NULL) {
        EM_ASM({
            console.error("Error ubpf_load:", UTF8ToString($0));
        }, errmsg);
        // Should free errmsg
    }
    return rc;
}
