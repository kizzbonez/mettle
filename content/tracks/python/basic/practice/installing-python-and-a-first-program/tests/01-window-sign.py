# This test runs your script as a program, as `python solution.py` would, and
# compares what it printed with the sign from the instructions. In the text
# below, \n marks the end of a line, so "\n" on its own is the empty line.
expected = (
    "Welcome to Corner Books\n"
    "Open 9:00 to 17:30\n"
    "Closed on Sundays\n"
    "\n"
    "Goodbye\n"
)

ran = run_script()
assert ran.code == 0, (
    "the script stopped with an error before its last line. Read the traceback from the bottom up:\n" + ran.err
)
assert ran.out == expected, (
    "the script's output should be exactly the sign from the instructions.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)
