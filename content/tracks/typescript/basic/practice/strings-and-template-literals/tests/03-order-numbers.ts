import { pickupMessage } from "./solution.js";

check.equal(
  pickupMessage("Ines", 5, "5550123"),
  "Hi Ines, order 0005 is ready. Reminder sent to ***0123.",
  "a one-digit order number is padded with zeros",
);
check.equal(
  pickupMessage("Ines", 310, "5550123"),
  "Hi Ines, order 0310 is ready. Reminder sent to ***0123.",
  "a three-digit order number is padded with zeros",
);
check.equal(
  pickupMessage("Ines", 1234, "5550123"),
  "Hi Ines, order 1234 is ready. Reminder sent to ***0123.",
  "a four-digit order number stays as it is",
);
check.equal(
  pickupMessage("Ines", 98765, "5550123"),
  "Hi Ines, order 98765 is ready. Reminder sent to ***0123.",
  "an order number longer than four digits is not cut short",
);
