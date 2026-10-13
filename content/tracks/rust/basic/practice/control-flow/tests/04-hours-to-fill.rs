assert!(hours_to_fill(120, 100) == 0, "water that is already deeper than the target needs no time");
assert!(hours_to_fill(100, 100) == 0, "water that is exactly at the target needs no time");
assert!(hours_to_fill(99, 100) == 1, "one centimeter short still takes a whole hour");
assert!(hours_to_fill(85, 100) == 1, "the pool is full as soon as the depth reaches the target exactly");
assert!(hours_to_fill(84, 100) == 2, "one centimeter less than a single hour's rise takes a second hour");
assert!(hours_to_fill(40, 70) == 2, "two hours when two rises land exactly on the target");
assert!(hours_to_fill(0, 1) == 1, "an empty pool with a tiny target takes one hour");
assert!(hours_to_fill(0, 150) == 10, "an empty pool with a deep target takes one hour for every 15 cm");
assert!(hours_to_fill(0, 0) == 0, "a target of zero is reached at once");
