// Your first lab: a program that prints the sign by the door of the town pool.
//
// How a lab works:
//   1. Press Run. The compiler checks this program, then Node.js runs it, and
//      the first test compares what it printed with what the sign should say.
//   2. Read the test's message. It shows what the test expected and what the
//      program actually printed.
//   3. Make the one change the instructions ask for, on the line marked CHANGE.
//   4. Press Run again. When the test passes, press Submit, which also runs
//      the hidden tests.

// The pool's details. `const` gives a value a name, and `: string` and
// `: number` are type annotations: the compiler checks them, then erases them.
const poolName: string = "Riverside Pool";
const opensAt: number = 7;
// CHANGE the number on the next line: this summer the pool closes at 20, not 18.
const closesAt: number = 18;

// console.log prints the values between its parentheses, separated by spaces.
console.log("Welcome to", poolName);
console.log("Open every day from", opensAt, "to", closesAt);
console.log("Hours open each day:", closesAt - opensAt);
console.log("Please shower before you swim");
