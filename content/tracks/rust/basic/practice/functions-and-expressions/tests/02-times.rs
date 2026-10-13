assert!(total_minutes(0, 0) == 0, "no time at all is zero minutes");
assert!(total_minutes(0, 45) == 45, "minutes without hours stay as they are");
assert!(total_minutes(2, 0) == 120, "whole hours become sixty minutes each");
assert!(total_minutes(24, 59) == 1499, "hours and minutes are both counted");
assert!(total_minutes(1, 90) == 150, "minutes above 59 are simply added");

assert!(ready_in(0, 0, 0) == 0, "nothing to prepare and nothing to bake takes no time");
assert!(ready_in(0, 10, 50) == 60, "preparation minutes and baking minutes are added");
assert!(ready_in(2, 5, 0) == 125, "preparation hours are turned into minutes before adding");
assert!(ready_in(3, 0, 15) == 195, "whole preparation hours plus baking minutes");
