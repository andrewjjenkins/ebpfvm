# eBPF Virtual Machine

This is an implementation of the BPF/eBPF virtual machine in the browser.  Primarily for purposes of experimentation or single-stepping through a BPF program.

# License

BSD 3-Clause, see [LICENSE](./LICENSE)

This project depends on an imported and slightly modified version of
[ubpf](https://github.com/iovisor/ubpf), the Userspace BPF implementation
from Big Switch Networks.  All of that code is in the `ubpf/`
directory, and is licensed Apache 2.0, see [ubpf/LICENSE](./ubpf/LICENSE.txt).
