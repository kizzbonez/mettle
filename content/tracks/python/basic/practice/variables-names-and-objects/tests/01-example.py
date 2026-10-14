# The example from the instructions: the test types the two readings into
# your script, one per line, and compares what it printed.
expected = (
    "Previous reading: 4127\n"
    "New reading: 4398\n"
    "Used this month: 271\n"
)

ran = run_script(stdin="4127\n4398\n")
assert ran.code == 0, f"the script should run to the end without an error, but it stopped with:\n{ran.err}"
assert ran.out == expected, (
    "the script's output for the readings 4127 and 4398 should match the instructions exactly.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)
