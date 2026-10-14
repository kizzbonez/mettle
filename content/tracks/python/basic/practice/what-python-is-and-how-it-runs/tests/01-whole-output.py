# This test runs your script as a program, as `python solution.py` would, and
# compares everything it printed with the four lines from the instructions.
expected = (
    "School trip to the science museum\n"
    "Pupils: 4 classes of 28\n"
    "112\n"
    "The buses leave at 8:30.\n"
)

ran = run_script()
assert ran.code == 0, f"the script should run to the end without an error, but it stopped with:\n{ran.err}"
assert ran.out == expected, (
    "the script's output should be exactly the four lines from the instructions.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)
