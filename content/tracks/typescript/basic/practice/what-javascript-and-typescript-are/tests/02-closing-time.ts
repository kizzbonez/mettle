const lines = runScript().out.split("\n");
check.equal(lines[1], "Open every day from 7 to 20", "the line with the opening and closing times");
