use std::mem::size_of;

// ConnId: a newtype with a niche.
assert!(size_of::<ConnId>() == 4, "a ConnId is exactly as large as a u32");
assert!(
    size_of::<Option<ConnId>>() == 4,
    "an optional ConnId needs no tag, because zero is free to mean None"
);
assert!(ConnId::new(0).is_none(), "zero is not an id");
assert!(ConnId::new(1).map(ConnId::get) == Some(1), "the smallest id gives its number back");
assert!(
    ConnId::new(u32::MAX).map(ConnId::get) == Some(u32::MAX),
    "the largest id gives its number back"
);

let id = ConnId::new(42).expect("42 is a valid id");
let other = ConnId::new(43).expect("43 is a valid id");
assert!(id.get() == 42 && id.get() == 42, "get copies the id, so it can be asked twice");
assert!(id == ConnId::new(42).unwrap() && id != other, "ids compare by their number");

// Event: the large variant lives on the heap.
assert!(
    size_of::<Event>() <= 16,
    "an Event is 16 bytes or less once the capture is behind a thin pointer"
);

let mut bytes = [0_u8; 256];
for (index, byte) in bytes.iter_mut().enumerate() {
    *byte = index as u8;
}
let capture = Event::Capture(bytes.into());
match &capture {
    Event::Capture(stored) => {
        assert!(stored.len() == 256, "a capture still holds 256 bytes");
        assert!(
            stored.iter().enumerate().all(|(index, byte)| *byte == index as u8),
            "a capture holds the bytes it was built from, in order"
        );
    }
    _ => panic!("an event built as a capture is a capture"),
}
assert!(capture.clone() == capture, "a cloned capture equals the original");
assert!(
    Event::Capture([1_u8; 256].into()) != Event::Capture([2_u8; 256].into()),
    "captures compare by their bytes, not by where the bytes are stored"
);

assert!(Event::Opened(id) == Event::Opened(id), "the same event on the same connection is equal");
assert!(Event::Opened(id) != Event::Closed(id), "opening and closing are different events");
assert!(Event::Opened(id) != Event::Opened(other), "events on different connections are different");

let events: Vec<Event> = (1..=1000_u32)
    .map(|number| Event::Opened(ConnId::new(number).expect("ids from 1 are valid")))
    .collect();
assert!(
    std::mem::size_of_val(events.as_slice()) <= 16_000,
    "a thousand common events take 16,000 bytes or less"
);
