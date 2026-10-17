import { spawnSync } from "node:child_process";
import { makeLoan, type LoanInput } from "./solution.js";

const FIELDS = ["id", "title", "member", "dueDay", "renewals", "note"];

// Values and defaults.
check.equal(
  { ...makeLoan({ id: "L-9", title: "Kim", member: "M-5", dueDay: 30, renewals: 2, note: "reserved" }) },
  { id: "L-9", title: "Kim", member: "M-5", dueDay: 30, renewals: 2, note: "reserved" },
  "a loan with every field given",
);
check.equal(makeLoan({ id: "L-1", title: "Emma", member: "M-1", dueDay: 1, renewals: 0 }).renewals, 0, "renewals of 0 stays 0");
check.equal(makeLoan({ id: "L-1", title: "Emma", member: "M-1", dueDay: 1, note: "" }).note, "", "an empty note is kept");

// The same fields in the same order, however the input is written.
const inputs: LoanInput[] = [
  { id: "L-1", title: "Emma", member: "M-1", dueDay: 3 },
  { note: "water damage", dueDay: 4, member: "M-2", title: "Kim", id: "L-2" },
  { renewals: 1, id: "L-3", title: "Dune", member: "M-3", dueDay: 5 },
  { id: "L-4", title: "Ulysses", member: "M-4", dueDay: 6, renewals: 1, note: "reserved", shelf: "B2" } as LoanInput,
];
for (const input of inputs) {
  const loan = makeLoan(input);
  check.equal(Object.keys(loan), FIELDS, `the fields of loan ${input.id}, in order`);
  check.true("note" in loan, `loan ${input.id} has a note field even when it is undefined`);
}
check.true(!("shelf" in makeLoan(inputs[3])), "properties that are not loan fields are not copied");
check.true(makeLoan(inputs[0]) !== makeLoan(inputs[0]), "every call creates a new loan");

// Ask V8: do all loans share one hidden class?
const script = `
import { makeLoan } from "./out/solution.js";
const loans = [
  makeLoan({ id: "L-1", title: "Emma", member: "M-1", dueDay: 3 }),
  makeLoan({ note: "water damage", dueDay: 4, member: "M-2", title: "Kim", id: "L-2" }),
  makeLoan({ renewals: 1, id: "L-3", title: "Dune", member: "M-3", dueDay: 5 }),
  makeLoan({ id: "L-4", title: "Ulysses", member: "M-4", dueDay: 6, renewals: 1, note: "reserved", shelf: "B2" }),
];
console.log(loans.every((loan) => %HaveSameMap(loan, loans[0])));
`;
const ran = spawnSync(process.execPath, ["--allow-natives-syntax", "--input-type=module", "-e", script], { encoding: "utf8" });
check.equal(ran.status, 0, "the hidden-class check runs makeLoan without an error");
check.equal(ran.stdout.trim(), "true", "V8 gives loans built from different inputs the same hidden class");
