import { parseLine, parseProblem } from "./solution.js";

check.equal(parseProblem("P1"), 1, "parseProblem with P1");
check.equal(parseProblem("p12"), 12, "parseProblem accepts a lower-case p");
check.equal(parseProblem("P99"), 99, "parseProblem with the highest problem number");
check.equal(parseProblem("P07"), 7, "parseProblem with a leading zero");
check.equal(parseProblem("P0"), undefined, "parseProblem rejects problem 0");
check.equal(parseProblem("P100"), undefined, "parseProblem rejects a number above 99");
check.equal(parseProblem("P"), undefined, "parseProblem rejects a P with no number");
check.equal(parseProblem("3"), undefined, "parseProblem rejects a number without the P");
check.equal(parseProblem("Q3"), undefined, "parseProblem rejects another letter");
check.equal(parseProblem("P3.5"), undefined, "parseProblem rejects a fraction");
check.equal(parseProblem("P-2"), undefined, "parseProblem rejects a minus sign");
check.equal(parseProblem("P+3"), undefined, "parseProblem rejects a plus sign");
check.equal(parseProblem("P1e1"), undefined, "parseProblem rejects anything but digits after the P");

check.equal(
  parseLine("Ada P1 flash"),
  { climber: "ada", problem: 1, result: "flash" },
  "parseLine with a valid line, storing the climber's name in lower case",
);
check.equal(
  parseLine("  Bo   p4    ZONE  "),
  { climber: "bo", problem: 4, result: "zone" },
  "parseLine with extra spaces between and around the fields",
);
check.equal(parseLine("cy P2"), "expected 3 fields, found 2", "parseLine with a field missing");
check.equal(parseLine("cy P2 top again"), "expected 3 fields, found 4", "parseLine with an extra field");
check.equal(parseLine("cy"), "expected 3 fields, found 1", "parseLine with a single field");
check.equal(parseLine("cy P0 top"), "unknown problem \"P0\"", "parseLine with a bad problem");
check.equal(parseLine("cy P3 Lizard"), "unknown result \"Lizard\"", "parseLine with a bad result, quoted as written");
check.equal(
  parseLine("cy Q3 lizard"),
  "unknown problem \"Q3\"",
  "parseLine checks the problem before the result",
);
