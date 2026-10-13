assert!(!needs_second_tray(0), "no cookies need no second tray");
assert!(!needs_second_tray(1), "a single cookie fits on one tray");
assert!(!needs_second_tray(11), "one cookie fewer than a full tray fits on one tray");
assert!(!needs_second_tray(12), "exactly one full tray does not need a second one");
assert!(needs_second_tray(13), "one cookie more than a full tray needs a second one");
assert!(needs_second_tray(24), "two full trays need a second tray");
assert!(needs_second_tray(100), "a large batch needs a second tray");
