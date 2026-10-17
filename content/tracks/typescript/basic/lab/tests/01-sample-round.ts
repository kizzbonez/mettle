// Round 3 from the instructions, run as a program with the sheet typed into it.
const sheet = [
  "# Ridgeline league, round 3",
  "Ada P1 flash",
  "ada P2 zone",
  "Bo  P1 top",
  "bo P2 miss",
  "eli P1 FLASH",
  "Ada P2 top",
  "cy P1 lizard",
  "cy P2",
  "eli P2 zone",
  "Bo P3 flash",
  "eli P3 zone",
  "dee P10 zone",
  "",
].join("\n");

const ran = runScript(sheet);

check.equal(
  ran.out,
  "1. ada 45 (2 tops)\n2. bo 45 (2 tops)\n3. eli 45 (1 top)\n4. dee 10 (0 tops)\n",
  "the standings printed on standard output for the sample round",
);
check.equal(
  ran.err,
  "line 8: unknown result \"lizard\"\nline 9: expected 3 fields, found 2\n",
  "the rejected lines reported on standard error, numbered from the top of the sheet",
);
check.equal(ran.code, 1, "the exit code when some lines were rejected");
