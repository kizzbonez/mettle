import { wettestReadings } from "./solution.js";

check.equal(wettestReadings([9, 10, 100], 2), [100, 10], "readings are sorted as numbers, not as text");
check.equal(wettestReadings([5, 8, 5, 1], 3), [8, 5, 5], "equal readings are both kept");
check.equal(wettestReadings([2, 6], 5), [6, 2], "asking for more readings than there are returns them all");
check.equal(wettestReadings([2, 6], 0), [], "asking for none returns an empty array");

const week = [3, 10, 1];
wettestReadings(week, 2);
check.equal(week, [3, 10, 1], "the readings passed in are left in their order");

// readonly parameters accept arrays that may not be changed.
const locked: readonly number[] = [4, 1, 7];
check.equal(wettestReadings(locked, 1), [7], "a readonly array of readings");
