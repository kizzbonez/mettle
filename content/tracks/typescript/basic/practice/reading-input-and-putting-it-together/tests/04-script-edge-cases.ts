// Your file run as a program on logs that are empty, written on Windows, or
// missing their final line break.
const empty = runScript("");
check.equal(empty.out, "0 readings, 0 above 5 C\n", "the report for an empty log");
check.equal(empty.err, "", "nothing on standard error for an empty log");
check.equal(empty.code, 0, "the exit code for an empty log");

const windows = runScript("# cold room\r\n\r\n09:00,2\r\n  # after delivery\r\n11:00,8\r\n13:00,7,1\r\n");
check.equal(windows.out, "2 readings, 1 above 5 C\ntoo warm at 11:00: 8 C\n", "the report for a log with Windows line endings");
check.equal(
  windows.err,
  'line 6: expected "time,celsius" but found 3 field(s)\n',
  "the rejected line of a Windows log, counting blank and comment lines",
);
check.equal(windows.code, 1, "the exit code for a log with a rejected line");

const noFinalBreak = runScript("21:00,4\n22:00,5.5");
check.equal(noFinalBreak.out, "2 readings, 1 above 5 C\ntoo warm at 22:00: 5.5 C\n", "a log whose last line has no line break");
check.equal(noFinalBreak.code, 0, "the exit code for a log of good lines only");
