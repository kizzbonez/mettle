// parseDay accepts only real dates written YYYY-MM-DD.
import { parseDay } from "./solution.js";

check.equal(parseDay("2026-10-17")?.toISOString(), "2026-10-17T00:00:00.000Z", "a plain date is midnight UTC");
check.equal(parseDay("2028-02-29")?.toISOString(), "2028-02-29T00:00:00.000Z", "29 February in a leap year");
check.equal(parseDay("2026-12-31")?.toISOString(), "2026-12-31T00:00:00.000Z", "the last day of the year");

const refused = [
  "2026-02-29",
  "2026-02-30",
  "2026-04-31",
  "2026-13-01",
  "2026-00-10",
  "2026-10-00",
  "2026-1-5",
  "17/10/2026",
  "2026-10-17T09:30:00Z",
  " 2026-10-17",
  "2026-10-17 ",
  "yesterday",
  "",
];
for (const text of refused) {
  check.equal(parseDay(text), undefined, `parseDay refuses "${text}"`);
}
