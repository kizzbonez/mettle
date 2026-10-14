# The example from the instructions: 45 cookies, boxes of 6, and 2.5 for a
# full box. The test types the three lines into your script.
expected = (
    "Full boxes: 7\n"
    "Left over: 3\n"
    "Boxes needed: 8\n"
    "Takings: 17.5\n"
)

ran = run_script(stdin="45\n6\n2.5\n")
assert ran.code == 0, f"the script should run to the end without an error, but it stopped with:\n{ran.err}"
assert ran.out == expected, (
    "the script's output for the example should match the instructions exactly.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)
