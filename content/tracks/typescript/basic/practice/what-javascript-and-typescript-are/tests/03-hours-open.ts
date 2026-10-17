const lines = runScript().out.split("\n");
check.equal(lines[2], "Hours open each day: 13", "the hours open each day, worked out from the two times");
