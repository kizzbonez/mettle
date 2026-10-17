const lines = runScript().out.split("\n");
check.equal(lines[2], "Platform: " + process.platform, "the platform line, from process.platform");
