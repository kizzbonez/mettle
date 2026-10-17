import { feeInCents } from "./solution.js";

check.equal(feeInCents("0"), 0, "a stay of 0 minutes costs nothing");
check.equal(feeInCents("1"), 0, "a stay of 1 minute is free");
check.equal(feeInCents("15"), 0, "a stay of exactly 15 minutes is still free");
check.equal(feeInCents("16"), 250, "one minute past the free 15 starts the first hour");
check.equal(feeInCents("  14  "), 0, "spaces around the minutes are ignored");
