import { pickupMessage } from "./solution.js";

check.equal(
  pickupMessage("bo", 7, "5550199"),
  "Hi Bo, order 0007 is ready. Reminder sent to ***0199.",
  "a short name in lower case gets a capital first letter",
);
check.equal(
  pickupMessage("\tzoe\n", 7, "5550199"),
  "Hi Zoe, order 0007 is ready. Reminder sent to ***0199.",
  "a tab and a line break around the name are removed",
);
check.equal(
  pickupMessage("Oluwaseun", 7, "5550199"),
  "Hi Oluwaseun, order 0007 is ready. Reminder sent to ***0199.",
  "a name that already starts with a capital stays as it is",
);
check.equal(
  pickupMessage("mARIA", 7, "5550199"),
  "Hi MARIA, order 0007 is ready. Reminder sent to ***0199.",
  "only the first letter changes; the rest stays as it was typed",
);
check.equal(
  pickupMessage("  mary ann ", 7, "5550199"),
  "Hi Mary ann, order 0007 is ready. Reminder sent to ***0199.",
  "the space inside a two-word name is kept",
);
