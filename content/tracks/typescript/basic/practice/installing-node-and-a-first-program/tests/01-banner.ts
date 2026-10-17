// Runs your program and compares everything it printed with the banner from
// the instructions. The test runs on the same Node.js as your program, so it
// reads the platform and version from its own `process`.
const banner = runScript();
const expected =
  "Library kiosk starting\n" +
  "Kiosk 12, next kiosk 13\n" +
  "Platform: " + process.platform + "\n" +
  "Node.js: " + process.version + "\n" +
  "Ready\n";
check.equal(banner.out, expected, "everything the program printed");
