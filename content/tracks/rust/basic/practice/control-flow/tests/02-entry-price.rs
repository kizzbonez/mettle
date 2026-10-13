assert!(entry_price(0) == 0, "a baby gets in free");
assert!(entry_price(4) == 0, "the last age that gets in free");
assert!(entry_price(5) == 300, "the first age that pays the child price");
assert!(entry_price(15) == 300, "the last age that pays the child price");
assert!(entry_price(16) == 600, "the first age that pays the full price");
assert!(entry_price(64) == 600, "the last age that pays the full price");
assert!(entry_price(65) == 350, "the first age that pays the senior price");
assert!(entry_price(120) == 350, "a very old visitor pays the senior price");
