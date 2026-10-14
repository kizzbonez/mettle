# The example from the instructions: a bill of 57.60, a 15% tip and four
# people. The test types the three lines into your script.
expected = (
    "Bill: 57.60 | Tip rate: 15% | People: 4\n"
    "Tip: 8.64\n"
    "Total: 66.24\n"
    "Each pays: 16.56\n"
)

ran = run_script(stdin="57.60\n15\n4\n")
assert ran.code == 0, f"the script should run to the end without an error, but it stopped with:\n{ran.err}"
assert ran.out == expected, (
    "the script's output for the example should match the instructions exactly.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)
