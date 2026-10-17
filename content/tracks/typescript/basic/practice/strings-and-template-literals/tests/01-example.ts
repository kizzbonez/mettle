import { pickupMessage } from "./solution.js";

// The example from the instructions.
check.equal(
  pickupMessage("  ada ", 42, "0412 555 019"),
  "Hi Ada, order 0042 is ready. Reminder sent to ******5019.",
  'pickupMessage("  ada ", 42, "0412 555 019")',
);
