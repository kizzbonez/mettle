ran = run_script()
lines = ran.out.split("\n")

assert ran.code == 0, "the script runs to the end without an error"
assert len(lines) > 3, "the script prints a line for the number of pupils"
assert lines[2] == "112", "the third line is the number the calculation gives, with nothing else on the line"
