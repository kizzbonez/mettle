import { pickupMessage } from "./solution.js";

check.equal(
  pickupMessage("Rui", 12, "07 700 900 123"),
  "Hi Rui, order 0012 is ready. Reminder sent to *******0123.",
  "every space is removed, and every digit but the last four becomes a star",
);
check.equal(
  pickupMessage("Rui", 12, "5550100"),
  "Hi Rui, order 0012 is ready. Reminder sent to ***0100.",
  "a phone number written without spaces",
);
check.equal(
  pickupMessage("Rui", 12, " 555 0100 "),
  "Hi Rui, order 0012 is ready. Reminder sent to ***0100.",
  "spaces at both ends of the phone number are removed too",
);
check.equal(
  pickupMessage("Rui", 12, "4821"),
  "Hi Rui, order 0012 is ready. Reminder sent to 4821.",
  "a phone number of only four digits gets no stars",
);
