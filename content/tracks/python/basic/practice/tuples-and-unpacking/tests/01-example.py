# The example from the instructions: four runners, two of them with the same
# time. The test types the two lines into your script.
expected = (
    "1. Bo 24:55\n"
    "2. Di 24:55\n"
    "3. Ada 25:20\n"
    "4. Cy 26:50\n"
    "spread: 1:55\n"
)

ran = run_script(stdin="Ada Bo Cy Di\n1520 1495 1610 1495\n")
assert ran.code == 0, f"the script should run to the end without an error, but it stopped with:\n{ran.err}"
assert ran.out == expected, (
    "the script's output for the example should match the instructions exactly.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)
