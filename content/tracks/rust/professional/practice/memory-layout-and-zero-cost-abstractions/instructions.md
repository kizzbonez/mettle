The starter compiles, and every type in it is larger than it has to be. Make the four changes
below. Keep the names, the `derive` lines and the signatures.

1. `c_layout(fields: &[(usize, usize)]) -> StructLayout` works out the layout of a
   `#[repr(C)]` struct. Each element of `fields` is the `(size, alignment)` of one field, in
   declaration order. Every alignment is a power of two, and a size may be 0. The rules:
   - a field starts at the first offset that is not before the end of the previous field and
     is a multiple of the field's own alignment. The first field starts at 0;
   - the struct's alignment is the largest alignment among its fields, and 1 for a struct
     with no fields. A field of size 0 counts like any other;
   - the struct's size is the end of the last field, rounded up to a multiple of the struct's
     alignment.

   Return all three in a `StructLayout`: `size`, `align`, and `offsets` with one offset for
   each field.
2. `FlowRecord` is written to the capture file byte for byte, so it stays `#[repr(C)]` and the
   compiler will not reorder it for you. Reorder its five fields yourself: from the largest
   alignment to the smallest, and fields with the same alignment in the order they have now.
   The record shrinks from 32 bytes to 16.
3. `ConnId` wraps a `u32`, and zero is never an id. Change the type of its field so that
   `Option<ConnId>` takes 4 bytes instead of 8. `ConnId::new(raw: u32) -> Option<ConnId>`
   returns `None` for zero, and `get(self) -> u32` returns the number.
4. `Event` takes 260 bytes because of one rare variant. Make `Capture` hold a
   `Box<[u8; 256]>`, so that an `Event` takes 16 bytes.

The tests ask the compiler for the truth with `size_of`, `align_of` and `offset_of!`, and
compare your `c_layout` with real `#[repr(C)]` structs.

Example:

```rust
use std::mem::size_of;

// FlowRecord as the starter declares it: bool, u64, u16, u32, u8.
let before = c_layout(&[(1, 1), (8, 8), (2, 2), (4, 4), (1, 1)]);
before.size                        // 32
before.align                       // 8
before.offsets                     // [0, 8, 16, 20, 24]

size_of::<FlowRecord>()            // 16, once the fields are in the new order
size_of::<Option<ConnId>>()        // 4
ConnId::new(0)                     // None
ConnId::new(7).map(ConnId::get)    // Some(7)
size_of::<Event>()                 // 16
```

**Tip:** run `c_layout` on the new field order of `FlowRecord` before you trust it. The
offsets it prints are the ones a hidden test reads from the compiler.
