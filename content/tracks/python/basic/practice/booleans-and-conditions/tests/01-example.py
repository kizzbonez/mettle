# The two examples from the instructions: the test types an age and a day
# into your script and compares what it printed.
ran = run_script(stdin="12\nTuesday\n")
assert ran.code == 0, f"the script should run to the end without an error, but it stopped with:\n{ran.err}"
expected = "child ticket: 5\nTuesday saver\n"
assert ran.out == expected, (
    "the output for a 12-year-old on Tuesday should match the instructions exactly.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)

ran = run_script(stdin="70\nfriday\n")
assert ran.code == 0, f"the script should run to the end without an error, but it stopped with:\n{ran.err}"
expected = "senior ticket: 7\n"
assert ran.out == expected, (
    "the output for a 70-year-old on Friday should match the instructions exactly.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)
