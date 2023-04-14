These files are all transformed into Javascript in
`src/generated/vm/consts/`; see Makefile.

You should do this:

```
import task_struct_hex from '../generated/vm/consts/task_struct';
```

rather than try to use these directly.


Dump of program in x86
```
   0xffffffffc0161335:  int3
   0xffffffffc0161336:  int3
   0xffffffffc0161337:  int3
   0xffffffffc0161338:  nopl   0x0(%rax,%rax,1)
=> 0xffffffffc016133d:  xchg   %ax,%ax
   0xffffffffc016133f:  push   %rbp
   0xffffffffc0161340:  mov    %rsp,%rbp
   0xffffffffc0161343:  sub    $0x10,%rsp
   0xffffffffc016134a:  push   %rbx
   0xffffffffc016134b:  mov    0x68(%rdi),%rbx
   0xffffffffc016134f:  xor    %edi,%edi
   0xffffffffc0161351:  mov    %edi,-0x10(%rbp)
   0xffffffffc0161354:  add    $0x518,%rbx
   0xffffffffc016135b:  mov    %rbp,%rdi
   0xffffffffc016135e:  add    $0xfffffffffffffff0,%rdi
   0xffffffffc0161362:  mov    $0x4,%esi
   0xffffffffc0161367:  mov    %rbx,%rdx
   0xffffffffc016136a:  callq  0xffffffff8115ade0 <bpf_probe_read_compat>
   0xffffffffc016136f:  mov    -0x10(%rbp),%edi
   0xffffffffc0161372:  shl    $0x20,%rdi
   0xffffffffc0161376:  sar    $0x20,%rdi
   0xffffffffc016137a:  mov    %rdi,-0x8(%rbp)
   0xffffffffc016137e:  movabs $0xffff88812391bc00,%rdi
   0xffffffffc0161388:  mov    %rbp,%rsi
   0xffffffffc016138b:  add    $0xfffffffffffffff8,%rsi
   0xffffffffc016138f:  callq  0xffffffff8118fcb0 <__htab_map_lookup_elem>
   0xffffffffc0161394:  test   %rax,%rax
   0xffffffffc0161397:  je     0xffffffffc016139d
   0xffffffffc0161399:  add    $0x38,%rax
   0xffffffffc016139d:  test   %rax,%rax
   0xffffffffc01613a0:  je     0xffffffffc01613b0
   0xffffffffc01613a2:  mov    0x0(%rax),%rdi
   0xffffffffc01613a6:  add    $0x1,%rdi
   0xffffffffc01613aa:  mov    %rdi,0x0(%rax)
   0xffffffffc01613ae:  jmp    0xffffffffc01613db
   0xffffffffc01613b0:  mov    $0x1,%edi
   0xffffffffc01613b5:  mov    %rdi,-0x10(%rbp)
   0xffffffffc01613b9:  movabs $0xffff88812391bc00,%rdi
   0xffffffffc01613c3:  mov    %rbp,%rsi
   0xffffffffc01613c6:  add    $0xfffffffffffffff8,%rsi
   0xffffffffc01613ca:  mov    %rbp,%rdx
   0xffffffffc01613cd:  add    $0xfffffffffffffff0,%rdx
   0xffffffffc01613d1:  mov    $0x1,%ecx
   0xffffffffc01613d6:  callq  0xffffffff8118f7c0 <htab_map_update_elem>
   0xffffffffc01613db:  movabs $0x6425203a646970,%rdi
   0xffffffffc01613e5:  mov    %rdi,-0x8(%rbp)
   0xffffffffc01613e9:  xor    %edi,%edi
   0xffffffffc01613eb:  mov    %edi,-0x10(%rbp)
   0xffffffffc01613ee:  mov    %rbp,%rdi
   0xffffffffc01613f1:  add    $0xfffffffffffffff0,%rdi
   0xffffffffc01613f5:  mov    $0x4,%esi
   0xffffffffc01613fa:  mov    %rbx,%rdx
   0xffffffffc01613fd:  callq  0xffffffff8115ade0 <bpf_probe_read_compat>
   0xffffffffc0161402:  mov    -0x10(%rbp),%edx
   0xffffffffc0161405:  mov    %rbp,%rdi
   0xffffffffc0161408:  add    $0xfffffffffffffff8,%rdi
   0xffffffffc016140c:  mov    $0x8,%esi
   0xffffffffc0161411:  callq  0xffffffff8115a860 <bpf_trace_printk>
   0xffffffffc0161416:  xor    %eax,%eax
   0xffffffffc0161418:  pop    %rbx
   0xffffffffc0161419:  leaveq
   0xffffffffc016141a:  retq
   0xffffffffc016141b:  int3
   0xffffffffc016141c:  int3
   0xffffffffc016141d:  int3
```
