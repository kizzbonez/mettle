// Runs your program, as `node solution.js` would, and compares everything it
// printed with the summer sign from the instructions.
const sign = runScript();
check.equal(
  sign.out,
  "Welcome to Riverside Pool\nOpen every day from 7 to 20\nHours open each day: 13\nPlease shower before you swim\n",
  "everything the program printed",
);
