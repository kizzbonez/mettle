// The program run on sheets that are clean, empty, written on Windows, or entirely wrong.
const clean = runScript("kai P1 top\nlu P1 flash\n");
check.equal(clean.out, "1. lu 25 (1 top)\n2. kai 20 (1 top)\n", "the standings for a clean sheet");
check.equal(clean.err, "", "nothing on standard error for a clean sheet");
check.equal(clean.code, 0, "the exit code for a clean sheet");

const empty = runScript("");
check.equal(empty.out, "No attempts\n", "the output for an empty sheet");
check.equal(empty.code, 0, "the exit code for an empty sheet");

const windows = runScript("# round 4\r\n\r\nkai P1 top\r\nkai P2 zone\r\n  # judge two\r\nmo P1 slab\r\n");
check.equal(windows.out, "1. kai 30 (1 top)\n", "the standings for a sheet with Windows line endings");
check.equal(
  windows.err,
  "line 6: unknown result \"slab\"\n",
  "the rejected line of a sheet with Windows line endings, counting blank and comment lines",
);
check.equal(windows.code, 1, "the exit code for a sheet with a rejected line");

const wrong = runScript("kai P1\nP2 top kai\n");
check.equal(wrong.out, "No attempts\n", "the output when every line is rejected");
check.equal(
  wrong.err,
  "line 1: expected 3 fields, found 2\nline 2: unknown problem \"top\"\n",
  "the rejected lines when every line is rejected",
);
check.equal(wrong.code, 1, "the exit code when every line is rejected");

const noFinalNewline = runScript("ivy P9 miss");
check.equal(noFinalNewline.out, "1. ivy 0 (0 tops)\n", "a sheet whose last line has no line break");
