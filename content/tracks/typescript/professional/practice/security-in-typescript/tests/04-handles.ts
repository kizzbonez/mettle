import { isValidHandle } from "./solution.js";

for (const handle of ["abc", "chef.ana", "chef-ana-42", "a.b-c", "123", "a1b2", "x".repeat(32), "bo.bakes.bread"]) {
  check.equal(isValidHandle(handle), true, `"${handle}" is a valid handle`);
}

const invalid = [
  "ab",
  "x".repeat(33),
  "",
  "Chef",
  "chef_ana",
  "chef ana",
  "chef..ana",
  "chef.-ana",
  "-chef",
  "chef-",
  ".chef",
  "chef\n",
  "chéf",
  "@chef",
];
for (const handle of invalid) {
  check.equal(isValidHandle(handle), false, `${JSON.stringify(handle)} is not a valid handle`);
}

// Inputs crafted against backtracking patterns: each is within the length limit, so it reaches
// the pattern. A pattern that can split its input one way only answers at once.
const crafted = ["a".repeat(31) + "!", "9".repeat(31) + "-", "chef" + "a".repeat(27) + "_", "ab".repeat(15) + ".."];
for (const handle of crafted) {
  check.equal(isValidHandle(handle), false, `a crafted handle of ${handle.length} characters is refused`);
}

// Huge inputs are refused too.
check.equal(isValidHandle("a".repeat(100_000)), false, "a handle of 100,000 characters");
check.equal(isValidHandle("a-".repeat(50_000) + "a"), false, "a hyphenated handle of 100,001 characters");
