import { feeInCents } from "./solution.js";

check.equal(feeInCents("675"), 2750, "eleven started hours are below the highest fee");
check.equal(feeInCents("735"), 3000, "twelve started hours cost exactly the highest fee");
check.equal(feeInCents("736"), 3000, "thirteen started hours are capped at the highest fee");
check.equal(feeInCents("2000"), 3000, "a stay of more than a day is capped at the highest fee");
check.true(Number.isNaN(feeInCents("12px")), "text with letters after the digits gives NaN");
check.true(Number.isNaN(feeInCents("1h30")), "a stay written in hours and minutes gives NaN");
check.true(Number.isNaN(feeInCents("ten")), "a stay written in words gives NaN");
