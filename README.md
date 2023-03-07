# eBPF Virtual Machine

This is an implementation of the BPF/eBPF virtual machine in the browser.  Primarily for purposes of experimentation or single-stepping through a BPF program.

The eBPF virtual machine itself is from [UBPF](https://github.com/iovisor/ubpf),
the Userspace BPF VM.  UBPF is written in C; it is compiled to WebAssembly
([WASM](https://webassembly.org/)) by [Emscripten](https://emscripten.org/).
Then Javascript (TypeScript) from [src/vm](./src/vm/) is used to load the WASM
into the browser, and operate the VM.

# Run
You can try it out live in the browser: go [here](https://andrewjjenkins.github.io/ebpfvm/)

You can run the latest build:

```
docker run --rm -it -p 8080:80 ghcr.io/andrewjjenkins/ebpfvm:main
```

Navigate to [http://localhost:8080/](http://localhost:8080/)

# Setup

Development is done on Linux; building may work on other platforms.

You will need:

- node.js (v14.18.2 is the version I use)
- make
- bash
- curl
- tar
- Python 3 (for emscripten)

The setup will download Emscripten's "emsdk" into the `emsdk/` directory, which
is large (~1GB).  If you already have emsdk somewhere else, you can symlink the
`emsdk/` directory to your installed location before running any build steps.

To build, run "make":

```
make
```

This will produce HTML/CSS/JS in the build/ directory that you can serve with any webserver.

If you'd like to do interactive development, run this instead:

```
make run
```

You can build the docker container:

```
docker build -t ebpfvm .
```

# License

Apache 2.0, see [LICENSE.txt](./LICENSE.txt)

This project depends on an imported and slightly modified version of
[ubpf](https://github.com/iovisor/ubpf), the Userspace BPF implementation
from Big Switch Networks.  All of that code is in the `ubpf/`
directory, and is licensed Apache 2.0 as well, see [ubpf/LICENSE](./ubpf/LICENSE.txt).

The project depends on an imported and modified version of
[react-hex-editor](https://github.com/kmck/react-hex-editor) from Keith
McKnight.  All of that code is in the `src/hex-editor` directory, and is
licensed ISC, see [src/hex-editor/LICENSE](./src/hex-editor/LICENSE).

The favicon is based on [twemoji](https://github.com/twitter/twemoji),
Copyright 2020 Twitter, Inc and other contributors.  CC-BY 4.0
(https://creativecommons.org/licenses/by/4.0/)

If you use ebpfvm in a part of another project, I'd love to hear about it!
