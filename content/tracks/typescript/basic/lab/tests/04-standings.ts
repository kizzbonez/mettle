import { formatStanding, standings, type Attempt } from "./solution.js";

check.equal(standings([]), [], "standings of an empty list");

const best: Attempt[] = [
  { climber: "ada", problem: 1, result: "zone" },
  { climber: "ada", problem: 1, result: "flash" },
  { climber: "ada", problem: 1, result: "top" },
  { climber: "ada", problem: 2, result: "miss" },
];
check.equal(
  standings(best),
  [{ climber: "ada", points: 25, tops: 1 }],
  "standings count only the best result on each problem",
);

const ties: Attempt[] = [
  { climber: "zoe", problem: 1, result: "zone" },
  { climber: "zoe", problem: 2, result: "zone" },
  { climber: "zoe", problem: 3, result: "zone" },
  { climber: "zoe", problem: 4, result: "zone" },
  { climber: "lu", problem: 1, result: "top" },
  { climber: "mo", problem: 1, result: "flash" },
  { climber: "lu", problem: 2, result: "top" },
  { climber: "kai", problem: 1, result: "top" },
  { climber: "mo", problem: 2, result: "miss" },
  { climber: "kai", problem: 2, result: "top" },
  { climber: "ivy", problem: 5, result: "miss" },
];
const before = JSON.stringify(ties);
check.equal(
  standings(ties),
  [
    { climber: "kai", points: 40, tops: 2 },
    { climber: "lu", points: 40, tops: 2 },
    { climber: "zoe", points: 40, tops: 0 },
    { climber: "mo", points: 25, tops: 1 },
    { climber: "ivy", points: 0, tops: 0 },
  ],
  "standings sorted by points, then tops, then name",
);
check.equal(JSON.stringify(ties), before, "standings leaves the list of attempts unchanged");

check.equal(
  formatStanding(1, { climber: "kai", points: 40, tops: 2 }),
  "1. kai 40 (2 tops)",
  "formatStanding with two tops",
);
check.equal(
  formatStanding(4, { climber: "mo", points: 25, tops: 1 }),
  "4. mo 25 (1 top)",
  "formatStanding with exactly one top",
);
check.equal(
  formatStanding(12, { climber: "ivy", points: 0, tops: 0 }),
  "12. ivy 0 (0 tops)",
  "formatStanding with no tops",
);
