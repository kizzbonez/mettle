use std::mem::{align_of, offset_of, size_of};

assert!(
    size_of::<FlowRecord>() == 16,
    "FlowRecord has no padding left: its five fields need 16 bytes and it takes 16"
);
assert!(
    align_of::<FlowRecord>() == 8,
    "FlowRecord keeps the alignment of its u64 field, so nothing was packed"
);

// From the largest alignment to the smallest, ties in the order of the starter.
assert!(offset_of!(FlowRecord, bytes) == 0, "the u64 field comes first");
assert!(offset_of!(FlowRecord, packets) == 8, "the u32 field follows the u64 field");
assert!(offset_of!(FlowRecord, port) == 12, "the u16 field follows the u32 field");
assert!(
    offset_of!(FlowRecord, active) == 14,
    "the two one-byte fields come last and keep the order they had: active, then protocol"
);
assert!(
    offset_of!(FlowRecord, protocol) == 15,
    "the two one-byte fields come last and keep the order they had: active, then protocol"
);

// The fields themselves are unchanged.
let record = FlowRecord {
    active: true,
    bytes: 9_000_000_000,
    port: 443,
    packets: 70_000,
    protocol: 6,
};
assert!(
    record.bytes == 9_000_000_000_u64 && record.packets == 70_000_u32 && record.port == 443_u16,
    "the three number fields keep their names and types"
);
assert!(record.active && record.protocol == 6_u8, "the two one-byte fields keep their names and types");

let copy = record;
assert!(copy == record, "a FlowRecord can still be copied and compared");

let table = vec![record; 1000];
assert!(
    std::mem::size_of_val(table.as_slice()) == 16_000,
    "a thousand records take 16,000 bytes"
);
