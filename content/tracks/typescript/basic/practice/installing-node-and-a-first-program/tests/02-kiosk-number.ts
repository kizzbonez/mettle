const lines = runScript().out.split("\n");
check.equal(lines[1], "Kiosk 12, next kiosk 13", "the kiosk line, which adds 1 to the kiosk number");
