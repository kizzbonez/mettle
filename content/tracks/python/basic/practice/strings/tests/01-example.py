# The example from the instructions: the test types the name, with its odd
# capitals and spaces, into your script and compares the four lines.
expected = (
    "Ada Lovelace\n"
    "LOVELACE, Ada\n"
    "A.L.\n"
    "|    Ada Lovelace    |\n"
)

ran = run_script(stdin="  ada   LOVELACE \n")
assert ran.code == 0, f"the script should run to the end without an error, but it stopped with:\n{ran.err}"
assert ran.out == expected, (
    "the script's output for the example should match the instructions exactly.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)
