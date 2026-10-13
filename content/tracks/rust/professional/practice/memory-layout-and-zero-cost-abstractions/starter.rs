//! Flow Table
//!
//! The records a network monitor keeps for every open connection. This file
//! compiles, but each type in it is larger than its contents need: padding
//! between fields, a tag where a niche would do, and one huge enum variant.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// The layout of a `#[repr(C)]` struct.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StructLayout {
    /// The bytes one value occupies, padding included.
    pub size: usize,
    /// The alignment of the whole struct.
    pub align: usize,
    /// The offset of every field, in declaration order.
    pub offsets: Vec<usize>,
}

/// Lays out a `#[repr(C)]` struct. Each element of `fields` is the
/// `(size, alignment)` of one field, in declaration order.
pub fn c_layout(fields: &[(usize, usize)]) -> StructLayout {
    // TODO 1: place each field at a multiple of its alignment, then round the
    //         size up to a multiple of the largest alignment
    todo!("c_layout")
}

/// One open connection. The capture file stores these bytes as they are, so
/// the layout is fixed with `repr(C)` and the field order is ours to choose.
#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct FlowRecord {
    // TODO 2: this order wastes 16 of 32 bytes. Reorder the five fields and
    //         keep `#[repr(C)]`, the names and the types.
    pub active: bool,
    pub bytes: u64,
    pub port: u16,
    pub packets: u32,
    pub protocol: u8,
}

/// The id of a connection. Zero is never an id.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ConnId(
    // TODO 3: a `u32` can be zero, so `Option<ConnId>` needs a tag of its own.
    //         Choose a field type that leaves zero free for `None`.
    u32,
);

impl ConnId {
    /// Wraps an id, or returns `None` for zero.
    pub fn new(raw: u32) -> Option<ConnId> {
        todo!("ConnId::new")
    }

    /// The id as a plain number.
    pub fn get(self) -> u32 {
        todo!("ConnId::get")
    }
}

/// What the monitor reports about a connection.
#[derive(Debug, Clone, PartialEq)]
pub enum Event {
    Opened(ConnId),
    Closed(ConnId),
    /// The first bytes of a suspicious connection. Rare.
    // TODO 4: every `Event` is as large as this variant. Move the bytes to
    //         the heap.
    Capture([u8; 256]),
}
