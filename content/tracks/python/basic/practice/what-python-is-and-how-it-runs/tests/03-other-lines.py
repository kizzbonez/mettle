ran = run_script()
lines = ran.out.split("\n")

assert lines[0] == "School trip to the science museum", "the first line is printed as it was in the starter"
assert len(lines) > 1 and lines[1] == "Pupils: 4 classes of 28", "the second line is printed as it was in the starter"
assert ran.out.endswith("The buses leave at 8:30.\n"), "the line about the buses is printed as it was, and comes last"
assert len(lines) == 5 and lines[4] == "", "the script prints exactly four lines"
