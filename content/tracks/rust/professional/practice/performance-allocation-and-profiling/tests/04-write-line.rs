// Content: each call replaces what the buffer held.
let mut line = String::new();
write_line(&mut line, 1, "A", 2);
assert!(
    line == "order=1 sku=A qty=2",
    "a line has its three fields in order, separated by single spaces"
);
write_line(&mut line, u32::MAX, "LONG-SKU-0001", u32::MAX);
assert!(
    line == "order=4294967295 sku=LONG-SKU-0001 qty=4294967295",
    "a longer line replaces a shorter one completely"
);
write_line(&mut line, 3, "", 0);
assert!(
    line == "order=3 sku= qty=0",
    "a shorter line replaces a longer one, with nothing of the old line left over"
);

// One buffer, 1,000 lines.
let expected_length: usize = (0..1000_u32).map(|order| line_before(order, "AB-12", order % 7).len()).sum();
let mut line = String::with_capacity(64);
let buffer = line.as_ptr();
let capacity = line.capacity();
let mut written = 0;
let count = allocations(|| {
    for order in 0..1000_u32 {
        write_line(&mut line, order, "AB-12", order % 7);
        written += line.len();
    }
});
assert!(
    count == 0,
    "1,000 lines written into a buffer that is large enough cost no allocation, and {count} were made"
);
assert!(
    line.as_ptr() == buffer && line.capacity() == capacity,
    "the caller's buffer is kept and not exchanged for a new one"
);
assert!(
    line == line_before(999, "AB-12", 999 % 7),
    "the buffer holds the last of the 1,000 lines, exactly as production writes it"
);
assert!(
    written == expected_length,
    "each of the 1,000 lines is as long as the line production writes"
);

// A buffer that is too small grows once and is then reused.
let mut small = String::with_capacity(4);
write_line(&mut small, 77, "A-VERY-LONG-SKU-NUMBER", 12);
assert!(
    small == line_before(77, "A-VERY-LONG-SKU-NUMBER", 12),
    "a buffer that is too small grows, and the line is complete"
);
let count = allocations(|| write_line(&mut small, 78, "A-VERY-LONG-SKU-NUMBER", 13));
assert!(
    small == line_before(78, "A-VERY-LONG-SKU-NUMBER", 13),
    "the next line replaces the one that made the buffer grow"
);
assert!(
    count == 0,
    "once the buffer has grown, a line of the same length costs no allocation, and {count} were made"
);
