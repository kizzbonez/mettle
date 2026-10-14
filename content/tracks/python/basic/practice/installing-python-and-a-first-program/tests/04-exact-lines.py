ran = run_script()
lines = ran.out.split("\n")

assert ran.code == 0, "the script runs to its last line without stopping on an error"
assert len(lines) == 6 and lines[5] == "", "the sign has exactly five lines, the empty one included"
assert lines[2] == "Closed on Sundays", "the third line is the day the shop is closed, unchanged"
assert lines[3] == "", "the fourth line is the empty line that print() writes"
assert lines[4] == "Goodbye", "the last line is the goodbye, with no quotes or spaces around it"
