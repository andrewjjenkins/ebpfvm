#include <emscripten.h>
#include "ubpf_int.h"
#include <stdint.h>

#define VMMEMORY_SIZE 1024
uint8_t vmMemory[VMMEMORY_SIZE];

uint8_t * EMSCRIPTEN_KEEPALIVE getVmMemory() {
    return vmMemory;
}

size_t EMSCRIPTEN_KEEPALIVE getVmMemorySize() {
    return VMMEMORY_SIZE;
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
