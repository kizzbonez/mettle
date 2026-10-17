const banner = runScript();
const lines = banner.out.split("\n");
check.equal(lines[0], "Library kiosk starting", "the first line of the banner");
check.equal(lines[3], "Node.js: " + process.version, "the Node.js line, fourth in the banner");
check.equal(lines[4], "Ready", "the last line of the banner");
check.equal(lines.length - 1, 5, "the number of lines printed");
check.equal(banner.err, "", "nothing printed as an error");
check.equal(banner.code, 0, "the exit code of the program");
