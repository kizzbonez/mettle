// The calculator must agree with the compiler on real `repr(C)` structs.
use std::mem::{align_of, offset_of, size_of};

#[repr(C)]
struct Mixed {
    flag: u8,
    count: u32,
    code: u16,
}
let layout = c_layout(&[(1, 1), (4, 4), (2, 2)]);
assert!(
    layout.offsets == vec![offset_of!(Mixed, flag), offset_of!(Mixed, count), offset_of!(Mixed, code)],
    "the offsets of fields u8, u32, u16: each field starts at a multiple of its own alignment"
);
assert!(
    layout.size == size_of::<Mixed>(),
    "the size of fields u8, u32, u16: the end of the last field is rounded up to the alignment"
);
assert!(layout.align == align_of::<Mixed>(), "the alignment of fields u8, u32, u16");

#[repr(C)]
struct Wasteful {
    a: u8,
    b: u64,
    c: u8,
}
let layout = c_layout(&[(1, 1), (8, 8), (1, 1)]);
assert!(
    layout.offsets == vec![offset_of!(Wasteful, a), offset_of!(Wasteful, b), offset_of!(Wasteful, c)],
    "the offsets of fields u8, u64, u8"
);
assert!(
    layout.size == size_of::<Wasteful>(),
    "the size of fields u8, u64, u8, which has padding after the last field"
);

#[repr(C)]
struct Tail {
    wide: u64,
    small: u8,
    tiny: u8,
}
let layout = c_layout(&[(8, 8), (1, 1), (1, 1)]);
assert!(
    layout.offsets == vec![0, offset_of!(Tail, small), offset_of!(Tail, tiny)],
    "fields u64, u8, u8: a field is padded to its own alignment, not to the largest one seen so far"
);
assert!(
    layout.size == size_of::<Tail>(),
    "fields u64, u8, u8: no padding between the fields, and padding after the last one"
);

#[repr(C)]
struct Late {
    a: u16,
    b: u8,
    wide: u64,
}
let layout = c_layout(&[(2, 2), (1, 1), (8, 8)]);
assert!(
    layout.align == align_of::<Late>(),
    "the alignment is the largest of all fields, also when that field comes last"
);
assert!(
    layout.size == size_of::<Late>() && layout.offsets == vec![0, offset_of!(Late, b), offset_of!(Late, wide)],
    "the size and offsets of fields u16, u8, u64"
);

#[repr(C)]
struct Bytes {
    a: u8,
    b: u8,
    c: u8,
}
let layout = c_layout(&[(1, 1), (1, 1), (1, 1)]);
assert!(
    layout.size == size_of::<Bytes>() && layout.align == align_of::<Bytes>(),
    "three u8 fields need no padding at all, and the size is not rounded up to a power of two"
);

// Arrays: the size is a multiple of the alignment, but not a power of two.
#[repr(C)]
struct Arrays {
    tag: [u8; 5],
    port: u16,
    words: [u32; 3],
}
let layout = c_layout(&[(5, 1), (2, 2), (12, 4)]);
assert!(
    layout.offsets == vec![offset_of!(Arrays, tag), offset_of!(Arrays, port), offset_of!(Arrays, words)],
    "the offsets of fields [u8; 5], u16, [u32; 3]"
);
assert!(
    layout.size == size_of::<Arrays>() && layout.align == align_of::<Arrays>(),
    "the size and alignment of fields [u8; 5], u16, [u32; 3]"
);

// A field of size 0 takes no room, but its alignment still counts.
#[repr(C)]
struct Marker {
    flag: u8,
    marker: [u64; 0],
}
let layout = c_layout(&[(1, 1), (0, 8)]);
assert!(
    layout.align == align_of::<Marker>(),
    "a field of size 0 still counts for the alignment of the struct"
);
assert!(
    layout.size == size_of::<Marker>() && layout.offsets == vec![0, offset_of!(Marker, marker)],
    "the size and offsets of fields u8, [u64; 0]"
);

// One field, and none.
let layout = c_layout(&[(4, 4)]);
assert!(
    layout == StructLayout { size: 4, align: 4, offsets: vec![0] },
    "a struct with one u32 field has the layout of a u32"
);
let layout = c_layout(&[]);
assert!(
    layout == StructLayout { size: 0, align: 1, offsets: vec![] },
    "a struct with no fields has size 0 and alignment 1"
);
