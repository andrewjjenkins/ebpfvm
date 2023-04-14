These files are all transformed into Javascript in
`src/generated/vm/consts/`; see Makefile.

You should do this:

```
import task_struct_hex from '../generated/vm/consts/task_struct';
```

rather than try to use these directly.
