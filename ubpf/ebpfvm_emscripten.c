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

#include <emscripten.h>
#include "ubpf_int.h"
#include <string.h>
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

uint64_t ebpf_trace_printk(struct ubpf_vm *vm, uint64_t r1, uint64_t r2, uint64_t r3, uint64_t r4, uint64_t r5) {
    char outBuffer[10240];

    const char *fmt = (const char *)(r1);
    char *safe_fmt = NULL;
    size_t fmt_len = (size_t)(r2);
    if (strnlen(fmt, fmt_len + 1) == fmt_len + 1) {
        char *safe_fmt = malloc(fmt_len + 1);
        strncpy(safe_fmt, fmt, fmt_len);
        safe_fmt[fmt_len] = '\0';
        fmt = safe_fmt;
    }
    /* Unknown if r3, r4, r5 are needed; let sprintf figure it out. */
    int rc = snprintf(outBuffer, sizeof(outBuffer), fmt, r3, r4, r5);
    if (rc < 0) {
        error_printf(NULL, "ebpf_trace_printk() encountered error");
        free(safe_fmt);
        return rc;
    }
    EM_ASM({
        console.log("ebpf_trace_printk(): ", UTF8ToString($0));
    }, outBuffer);
    vm->printCb(outBuffer);
    free(safe_fmt);
    return 0;
}

uint64_t ubpf_default_extension_func(struct ubpf_vm *vm, uint64_t r1, uint64_t r2, uint64_t r3, uint64_t r4, uint64_t r5) {
    EM_ASM({
        console.log("ubpf_default_extension_func(%d, %d, %d, %d, %d)", $0, $1, $2, $3, $4);
    }, r1, r2, r3, r4, r5);
    return 0;
}

struct ubpf_vm *vm = NULL;

int EMSCRIPTEN_KEEPALIVE ebpfvm_create_vm(void (*printCb)(const char *c)) {
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

    vm->printCb = printCb;

    for (unsigned int i = 0; i < 64; i++) {
        if (ubpf_register(vm, i, "ubpf_default_extension_func", ubpf_default_extension_func) < 0) {
            error_printf(NULL, "ebpfvm_create_vm(): failed to register extension func %d", i);
            return -1;
        }
    }
    if (ubpf_register(vm, 6, "ebpf_trace_printk", ebpf_trace_printk) < 0) {
        error_printf(NULL, "ebpfvm_create_vm(): failed to register extension func ebpf_trace_printk");
        return -1;
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
    vm->max_num_insts = n;
    return n;
}

int EMSCRIPTEN_KEEPALIVE ebpfvm_validate_instructions(int n) {
    if (vm->insts == NULL) {
        error_printf(NULL, "ebpfvm_validate_instructions(): no instructions");
        return -1;
    }
    if (n > vm->max_num_insts) {
        error_printf(
            NULL,
            "ebpfvm_validate_instructions(): too many instructions (%d > %d)",
            n,
            vm->max_num_insts);
    }
    vm->num_insts = n;

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

void * EMSCRIPTEN_KEEPALIVE ebpfvm_get_memory() {
    if (vm == NULL) {
        return NULL;
    }
    return vm->mem;
}

int EMSCRIPTEN_KEEPALIVE ebpfvm_get_memory_len() {
    if (vm == NULL) {
        return 0;
    }
    return vm->mem_len;
}

void * EMSCRIPTEN_KEEPALIVE ebpfvm_get_stack() {
    if (vm == NULL) {
        return NULL;
    }
    return vm->stack;
}

int EMSCRIPTEN_KEEPALIVE ebpfvm_get_stack_len() {
    if (vm == NULL) {
        return 0;
    }
    return UBPF_STACK_SIZE;
}

uint16_t * EMSCRIPTEN_KEEPALIVE ebpfvm_get_programcounter_address() {
    if (vm == NULL) {
        return NULL;
    }
    return &(vm->pc);
}

uint64_t * EMSCRIPTEN_KEEPALIVE ebpfvm_get_registers() {
    if (vm == NULL) {
        return NULL;
    }
    return vm->regs;
}

uint64_t * EMSCRIPTEN_KEEPALIVE ebpfvm_get_hot_address() {
    if (vm == NULL) {
        return NULL;
    }
    return &(vm->hot_address);
}

int EMSCRIPTEN_KEEPALIVE ebpfvm_exec_step() {
    if (vm == NULL) {
        error_printf(NULL, "ebpfvm_exec_step(): VM not initialized");
    }
    return ubpf_exec_step(vm);
}
