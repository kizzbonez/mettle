ran = run_script(stdin="15020\n15333\n")
assert ran.code == 0, "the script runs to the end without an error"
lines = ran.out.split("\n")
assert lines[0] == "Previous reading: 15020", "previous still refers to the first reading after reading is rebound"
assert len(lines) > 1 and lines[1] == "New reading: 15333", "reading refers to the second reading at the end"

ran = run_script(stdin="7\n90\n")
lines = ran.out.split("\n")
assert lines[0] == "Previous reading: 7", "previous takes whatever the first reading is, not a number written into the script"
