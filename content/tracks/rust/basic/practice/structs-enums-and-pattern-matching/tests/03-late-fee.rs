assert!(late_fee(0) == 0, "a book that is 0 days late costs nothing");
assert!(late_fee(1) == 50, "the first day of the lowest fee");
assert!(late_fee(4) == 50, "a day in the middle of the lowest fee");
assert!(late_fee(7) == 50, "the last day of the lowest fee is still in that range");
assert!(late_fee(8) == 200, "the first day of the middle fee");
assert!(late_fee(30) == 200, "the last day of the middle fee is still in that range");
assert!(late_fee(31) == 500, "the first day of the highest fee");
assert!(late_fee(1000) == 500, "anything longer stays at the highest fee");
assert!(late_fee(u32::MAX) == 500, "the largest possible number of days is covered too");
