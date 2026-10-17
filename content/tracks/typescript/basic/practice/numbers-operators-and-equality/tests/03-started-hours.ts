import { feeInCents } from "./solution.js";

check.equal(feeInCents("75"), 250, "exactly one hour after the free minutes is one hour");
check.equal(feeInCents("76"), 500, "one minute into the second hour pays for two hours");
check.equal(feeInCents("100"), 500, "a second hour that is not finished is still paid in full");
check.equal(feeInCents("135"), 500, "exactly two hours after the free minutes is two hours");
check.equal(feeInCents("136"), 750, "one minute into the third hour pays for three hours");
check.equal(feeInCents("75.5"), 500, "a stay with a fraction of a minute starts the next hour");
