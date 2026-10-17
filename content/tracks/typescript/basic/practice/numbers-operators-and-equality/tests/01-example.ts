import { feeInCents } from "./solution.js";

// The examples from the instructions.
check.equal(feeInCents("75"), 250, 'feeInCents("75")');
check.equal(feeInCents("200"), 1000, 'feeInCents("200")');
check.equal(feeInCents(" 10 "), 0, 'feeInCents(" 10 ")');
check.equal(feeInCents("900"), 3000, 'feeInCents("900")');
check.true(Number.isNaN(feeInCents("abc")), 'feeInCents("abc") gives NaN');
