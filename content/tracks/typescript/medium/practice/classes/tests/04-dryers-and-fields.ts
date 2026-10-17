// Dryers price every started ten minutes and extend Machine's describe(); every field is
// declared in the class body, with no parameter properties.
import { readFileSync } from "node:fs";
import { Dryer } from "./solution.js";

const cases: [number, number][] = [
  [1, 50],
  [10, 50],
  [11, 100],
  [45, 250],
  [60, 300],
  [61, 350],
];
for (const [minutes, cents] of cases) {
  check.equal(new Dryer("D", minutes).price(), cents, `the price of a ${minutes}-minute dry`);
}

const dryer = new Dryer("D4", 40);
check.equal(dryer.describe(), "D4: 200 cents, 40 min", "a dryer adds its minutes to Machine's description");
dryer.insert(500);
check.equal(dryer.start(), "D4 started", "a dryer starts like any machine");
check.equal(dryer.credit, 300, "a dryer keeps the change too");

const source = readFileSync("solution.ts", "utf8");
const parameterLists = [...source.matchAll(/constructor\s*\(([^)]*)\)/g)].map((match) => match[1]);
check.true(parameterLists.length >= 3, "solution.ts has a constructor in each of the three classes");
check.true(
  parameterLists.every((list) => !/\b(public|private|protected|readonly)\s+[A-Za-z_$]/.test(list)),
  "no constructor parameter is a parameter property (public, private, protected or readonly)",
);
