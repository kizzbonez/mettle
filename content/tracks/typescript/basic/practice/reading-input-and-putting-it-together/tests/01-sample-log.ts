// The example log from the instructions, typed into your program with no argument.
const log = [
  "# Walk-in fridge, Tuesday",
  "07:30,3.5",
  "10:00,4",
  "12:30,6.5",
  "14:00,warm",
  "1600,4.5",
  "18:30,5",
  "21:00,7",
  "",
].join("\n");

const ran = runScript(log);
check.equal(ran.out, "5 readings, 2 above 5 C\ntoo warm at 12:30: 6.5 C\ntoo warm at 21:00: 7 C\n", "the report on standard output");
check.equal(
  ran.err,
  'line 5: "warm" is not a temperature\nline 6: "1600" is not a time like 07:30\n',
  "the rejected lines on standard error",
);
check.equal(ran.code, 1, "the exit code when a line was rejected");
