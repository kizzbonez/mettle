# The examples from the instructions: one call of calculate, then the whole
# script with the example lines typed into it.
assert calculate("12 / 4") == 3.0, "calculate of the line 12 / 4"

lines = (
    "12 / 4\n"
    "2.5 * 4\n"
    "12 / 0\n"
    "2 ^ 3\n"
    "\n"
    "ten * 2\n"
    "7\n"
    "10 - 12.25\n"
)
expected = (
    "12 / 4 = 3.00\n"
    "2.5 * 4 = 10.00\n"
    "12 / 0 -> cannot divide by zero\n"
    "2 ^ 3 -> unknown operator ^\n"
    "ten * 2 -> could not convert string to float: 'ten'\n"
    "7 -> expected a number, an operator and a number\n"
    "10 - 12.25 = -2.25\n"
    "3 worked, 4 failed\n"
)

ran = run_script(stdin=lines)
assert ran.code == 0, f"the script should run to the end without an error, but it stopped with:\n{ran.err}"
assert ran.out == expected, (
    "the script's output for the example should match the instructions exactly.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)
