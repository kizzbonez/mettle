# The readings arrive with stray spaces around them; int() ignores those.
ran = run_script(stdin="  52 \n 60\n")
assert ran.code == 0, "the script runs to the end without an error"
assert ran.err == "", "the script writes nothing to the error output"
lines = ran.out.split("\n")
assert len(lines) == 4 and lines[3] == "", "the script prints exactly three lines"
assert lines[0].startswith("Previous reading: ") and lines[1].startswith("New reading: "), (
    "the first two lines keep the starter's labels, in the starter's order"
)
assert lines[2].startswith("Used this month: "), "the third line starts with the label from the instructions and one space"
assert ran.out == "Previous reading: 52\nNew reading: 60\nUsed this month: 8\n", (
    "every line is the label, one space and the number, with nothing else"
)
