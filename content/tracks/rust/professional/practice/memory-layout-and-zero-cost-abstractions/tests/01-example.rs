// The example from the instructions.
use std::mem::size_of;

// `FlowRecord` in the order the starter declares it: bool, u64, u16, u32, u8.
let before = c_layout(&[(1, 1), (8, 8), (2, 2), (4, 4), (1, 1)]);
assert_eq!(before.size, 32, "the size the calculator gives for fields bool, u64, u16, u32, u8");
assert_eq!(before.align, 8, "the alignment the calculator gives for those fields");
assert_eq!(
    before.offsets,
    vec![0, 8, 16, 20, 24],
    "the offsets the calculator gives for those fields"
);

assert_eq!(
    size_of::<FlowRecord>(),
    16,
    "the size of FlowRecord, which the compiler works out from the order of your fields"
);

assert_eq!(size_of::<Option<ConnId>>(), 4, "the size of an optional ConnId");
assert!(ConnId::new(0).is_none(), "zero is not an id");
assert_eq!(ConnId::new(7).map(ConnId::get), Some(7), "the number inside the id made from 7");

assert_eq!(size_of::<Event>(), 16, "the size of an Event");
