assert!(hours_and_minutes(0) == (0, 0), "no sunshine at all is zero hours and zero minutes");
assert!(hours_and_minutes(59) == (0, 59), "less than an hour has no whole hours");
assert!(hours_and_minutes(60) == (1, 0), "exactly one hour leaves no minutes over");
assert!(hours_and_minutes(61) == (1, 1), "the hours come first in the tuple and the minutes second");
assert!(hours_and_minutes(1439) == (23, 59), "the last minute of a day");
assert!(hours_and_minutes(6000) == (100, 0), "the hours are not limited to one day");
