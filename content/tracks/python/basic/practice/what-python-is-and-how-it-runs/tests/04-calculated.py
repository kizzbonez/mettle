# Look at the script itself: the number must come from Python doing the sum,
# not from typing the answer in by hand.
source = open("solution.py", encoding="utf-8").read()
code_lines = []
for line in source.split("\n"):
    if not line.strip().startswith("#"):
        code_lines.append(line.replace(" ", ""))

assert "print(4*28)" in code_lines or "print(28*4)" in code_lines, (
    "the calculation of 4 times 28 sits inside print( ), on a line of its own, so that Python works out the number"
)

ran = run_script()
assert ran.err == "", "the script writes nothing to the error output"
