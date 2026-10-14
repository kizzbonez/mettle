# The example from the instructions: the test types the commands into your
# script and compares what it printed.
commands = (
    "add milk\n"
    "add eggs\n"
    "add bread\n"
    "add milk\n"
    "got bread\n"
    "got butter\n"
    "urgent coffee\n"
    "urgent eggs\n"
    "done\n"
)
expected = (
    "already on the list: milk\n"
    "not on the list: butter\n"
    "to buy (3): eggs, coffee, milk\n"
    "by name: coffee, eggs, milk\n"
)

ran = run_script(stdin=commands)
assert ran.code == 0, f"the script should run to the end without an error, but it stopped with:\n{ran.err}"
assert ran.out == expected, (
    "the script's output for the example should match the instructions exactly.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)
