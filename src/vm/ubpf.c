#include <emscripten.h>
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
