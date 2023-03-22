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
export const DEFAULT_MEMORY_INIT = "hello world";
export const DEFAULT_MEMORY_MIN_SIZE = 128;

export const HELLOWORLD_HEXBYTECODE =
"b70100006c210a00631af8ff00000000180100006c6f6e65000000002063" +
"616c7b1af0ff0000000018010000206120730000000079735f637b1ae8ff" +
"00000000180100007265204900000000206469647b1ae0ff000000001801" +
"00006f726c6400000000212048657b1ad8ff000000001801000048656c6c" +
"000000006f2c20577b1ad0ff00000000bfa100000000000007010000d0ff" +
"ffffb70200002c0000008500000006000000b70000000000000095000000" +
"00000000";


// FIXME: "call 6" should be "call trace_printk" once
// symbol resolution works.
export const HELLOWORLD_SOURCE = `\
// entryPoint: kprobe__sys_clone
mov r1, 663916
stxw [r10-8], r1
lddw r1, 7809632219628990316
stxdw [r10-16], r1
lddw r1, 7160568898002116896
stxdw [r10-24], r1
lddw r1, 7235424366176003442
stxdw [r10-32], r1
lddw r1, 7298118523944727151
stxdw [r10-40], r1
lddw r1, 6278066737626506568
stxdw [r10-48], r1
mov r1, r10
add r1, -48
mov r2, 44
call 6
mov r0, 0
exit`;

export enum InstructionClass {
    EBPF_CLS_LD = 0x00,
    EBPF_CLS_LDX = 0x01,
    EBPF_CLS_ST = 0x02,
    EBPF_CLS_STX = 0x03,
    EBPF_CLS_ALU = 0x04,
    EBPF_CLS_JMP = 0x05,
    EBPF_CLS_JMP32 = 0x06,
    EBPF_CLS_ALU64 = 0x07,
}
export const EBPF_CLASS = (x: InstructionClass) => (x & 0x07);

export enum InstructionOpSize {
    EBPF_SIZE_W = 0x00,
    EBPF_SIZE_H = 0x08,
    EBPF_SIZE_B = 0x10,
    EBPF_SIZE_DW = 0x18,
}
export const EBPF_SIZE = (x: InstructionOpSize) => (x & 0x18);

export enum InstructionOpMode {
    EBPF_MODE_IMM = 0x00,
    EBPF_MODE_ABS = 0x20,
    EBPF_MODE_IND = 0x40,
    EBPF_MODE_MEM = 0x60,
    // EBPF_MODE_XADD = 0xc0,  // Unsupported
}
export const EBPF_MODE = (x: InstructionOpMode) => (x & 0xe0);

// ALU ops use this bit to indicate the source operand,
// except for endianness ALU ops, that use it to indicate
// big/little.
export enum InstructionSource {
    EBPF_SRC_IMM = 0x00,
    EBPF_SRC_REG = 0x08,
}
export const EBPF_SRC = (x: InstructionSource) => (x & 0x08);
export enum InstructionEndianness {
    EBPF_ENDIAN_LE = 0x00,
    EBPF_ENDIAN_BE = 0x08,
}
export const EBPF_ENDIANNESS = (x: InstructionEndianness) => (x & 0x08);

export enum InstructionOp {
    EBPF_ADD = 0x00,
    EBPF_SUB = 0x10,
    EBPF_MUL = 0x20,
    EBPF_DIV = 0x30,
    EBPF_OR = 0x40,
    EBPF_AND = 0x50,
    EBPF_LSH = 0x60,
    EBPF_RSH = 0x70,
    EBPF_NEG = 0x80,
    EBPF_MOD = 0x90,
    EBPF_XOR = 0xa0,
    EBPF_MOV = 0xb0,
    EBPF_ARSH = 0xc0,
    EBPF_ENDIAN = 0xd0,
}
export enum InstructionJumps {
    EBPF_JA = 0x00,
    EBPF_JEQ = 0x10,
    EBPF_JGT = 0x20,
    EBPF_JGE = 0x30,
    EBPF_JSET = 0x40,
    EBPF_JNE = 0x50,
    EBPF_JSGT = 0x60,
    EBPF_JSGE = 0x70,
    EBPF_CALL = 0x80,
    EBPF_EXIT = 0x90,
    EBPF_JLT = 0xa0,
    EBPF_JLE = 0xb0,
    EBPF_JSLT = 0xc0,
    EBPF_JSLE = 0xd0,
}
export const EBPF_OP = (x: InstructionOp) => (x & 0xf0);

export const OFFSET_MAX = Math.pow(2, 16) - 1;

export const EBPF_HELPER_FUNC_NAMES = [
   'unspec',
    'map_lookup_elem',
    'map_update_elem',
    'map_delete_elem',
    'probe_read',
    'ktime_get_ns',
    'trace_printk',
    'get_prandom_u32',
    'get_smp_processor_id',
    'skb_store_bytes',
    'l3_csum_replace',
    'l4_csum_replace',
    'tail_call',
    'clone_redirect',
    'get_current_pid_tgid',
    'get_current_uid_gid',
    'get_current_comm',
    'get_cgroup_classid',
    'skb_vlan_push',
    'skb_vlan_pop',
    'skb_get_tunnel_key',
    'skb_set_tunnel_key',
    'perf_event_read',
    'redirect',
    'get_route_realm',
    'perf_event_output',
    'skb_load_bytes',
    'get_stackid',
    'csum_diff',
    'skb_get_tunnel_opt',
    'skb_set_tunnel_opt',
    'skb_change_proto',
    'skb_change_type',
    'skb_under_cgroup',
    'get_hash_recalc',
    'get_current_task',
    'probe_write_user',
    'current_task_under_cgroup',
    'skb_change_tail',
    'skb_pull_data',
    'csum_update',
    'set_hash_invalid',
    'get_numa_node_id',
    'skb_change_head',
    'xdp_adjust_head',
    'probe_read_str',
    'get_socket_cookie',
    'get_socket_uid',
    'set_hash',
    'setsockopt',
    'skb_adjust_room',
    'redirect_map',
    'sk_redirect_map',
    'sock_map_update',
    'xdp_adjust_meta',
    'perf_event_read_value',
    'perf_prog_read_value',
    'getsockopt',
    'override_return',
    'sock_ops_cb_flags_set',
    'msg_redirect_map',
    'msg_apply_bytes',
    'msg_cork_bytes',
    'msg_pull_data',
    'bind',
    'xdp_adjust_tail',
    'skb_get_xfrm_state',
    'get_stack',
    'skb_load_bytes_relative',
    'fib_lookup',
    'sock_hash_update',
    'msg_redirect_hash',
    'sk_redirect_hash',
    'lwt_push_encap',
    'lwt_seg6_store_bytes',
    'lwt_seg6_adjust_srh',
    'lwt_seg6_action',
    'rc_repeat',
    'rc_keydown',
    'skb_cgroup_id',
    'get_current_cgroup_id',
    'get_local_storage',
    'sk_select_reuseport',
    'skb_ancestor_cgroup_id',
    'sk_lookup_tcp',
    'sk_lookup_udp',
    'sk_release',
    'map_push_elem',
    'map_pop_elem',
    'map_peek_elem',
    'msg_push_data',
    'msg_pop_data',
    'rc_pointer_rel',
];
export interface UnpackedInstruction {
    opcode: number,
    dst: number,
    src: number,
    offset: number,
    imm: number,
}
