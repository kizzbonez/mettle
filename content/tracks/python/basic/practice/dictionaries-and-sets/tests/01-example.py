# The example from the instructions: the test types the members and the
# votes into your script and compares what it printed.
lines = (
    "Ada, Bo, Cy, Di, Eve\n"
    "Ada: Dune\n"
    "Bo: The Hobbit\n"
    "Cy:  dune\n"
    "Finn: Emma\n"
    "Bo: Dune\n"
    "Di: the hobbit\n"
    "end\n"
)
expected = (
    "not a member: Finn\n"
    "dune: 3\n"
    "the hobbit: 1\n"
    "winner: dune\n"
    "did not vote: Eve\n"
)

ran = run_script(stdin=lines)
assert ran.code == 0, f"the script should run to the end without an error, but it stopped with:\n{ran.err}"
assert ran.out == expected, (
    "the script's output for the example should match the instructions exactly.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)
