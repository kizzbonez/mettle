ran = run_script()

assert ran.code == 0, "the script runs to its last line without stopping on an error"
assert "Traceback" not in ran.err and "Error" not in ran.err, "the script writes no traceback to the error output"
assert ran.out.endswith("Goodbye\n"), "the last line of the sign is printed as text, with its capital letter, and comes last"
assert ran.out.startswith("Welcome to Corner Books\nOpen 9:00 to 17:30\n"), (
    "the welcome and the opening hours are the first two lines, written as in the instructions"
)
