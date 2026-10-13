//! Flow Table
//!
//! The records a network monitor keeps for every open connection. Each type
//! here is as small as its contents allow: fields ordered to leave no
//! padding, a niche in place of a tag, and the one large variant on the heap.

use std::num::NonZeroU32;

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
    let mut offsets = Vec::new();
    let mut end = 0_usize;
    let mut align = 1_usize;
    for &(field_size, field_align) in fields {
        // Padding before the field: skip to a multiple of its alignment.
        let offset = end.next_multiple_of(field_align);
        offsets.push(offset);
        end = offset + field_size;
        align = align.max(field_align);
    }
    // Padding after the last field: the size is a multiple of the alignment.
    StructLayout { size: end.next_multiple_of(align), align, offsets }
}

/// One open connection. The capture file stores these bytes as they are, so
/// the layout is fixed with `repr(C)` and the field order is ours to choose.
#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct FlowRecord {
    pub bytes: u64,
    pub packets: u32,
    pub port: u16,
    pub active: bool,
    pub protocol: u8,
}

/// The id of a connection. Zero is never an id, so `Option<ConnId>` can use
/// it for `None` and needs no tag.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ConnId(NonZeroU32);

impl ConnId {
    /// Wraps an id, or returns `None` for zero.
    pub fn new(raw: u32) -> Option<ConnId> {
        NonZeroU32::new(raw).map(ConnId)
    }

    /// The id as a plain number.
    pub fn get(self) -> u32 {
        self.0.get()
    }
}

/// What the monitor reports about a connection.
#[derive(Debug, Clone, PartialEq)]
pub enum Event {
    Opened(ConnId),
    Closed(ConnId),
    /// The first bytes of a suspicious connection. Rare, and boxed so that
    /// the common events do not pay for it.
    Capture(Box<[u8; 256]>),
}
