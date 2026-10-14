# Several files, "-" for standard input among them, line numbers per file, and main(argv) called directly.
from pathlib import Path

Path("t2-morning.txt").write_text(" 4.0 \n\n  \n-2.5\nsensor off\n", encoding="utf-8")
Path("t2-evening.txt").write_text("1e1\n?\n8\n", encoding="utf-8")

ran = run_script(stdin="30\nwarm\n", args=["t2-morning.txt", "-", "t2-evening.txt"])
assert ran.code == 0, f"three sources, one of them '-', should exit with status 0, not {ran.code}; stderr:\n{ran.err}"
expected = ["count: 5", "min: -2.5", "max: 30.0", "mean: 9.9"]
assert ran.out.splitlines() == expected, (
    f"the readings of two files and standard input together; standard output was:\n{ran.out}"
)
warnings = [
    "skipping t2-morning.txt line 5: 'sensor off'",
    "skipping - line 2: 'warm'",
    "skipping t2-evening.txt line 2: '?'",
]
for warning in warnings:
    assert warning in ran.err.splitlines(), (
        f"standard error should name each source and count its own lines; expected the line {warning!r} in:\n{ran.err}"
    )
assert "skipping" not in ran.out, "warnings must go to standard error, not standard output"

ran = run_script(stdin="18\n22\n")
assert ran.code == 0 and ran.out.splitlines() == ["count: 2", "min: 18.0", "max: 22.0", "mean: 20.0"], (
    f"with no FILE at all the program should read standard input; it exited {ran.code} and printed:\n{ran.out}"
)

assert callable(globals().get("main")), "solution.py should define main(argv=None)"
status = None


def call_main():
    global status
    status = main(["t2-evening.txt", "--precision", "0"])


printed = printed_by(call_main)
assert status == 0, f"main([...]) should return the status 0, not {status!r}"
assert printed.splitlines() == ["count: 2", "min: 8", "max: 10", "mean: 9"], (
    f"main(['t2-evening.txt', '--precision', '0']) should print the summary with no decimals; it printed:\n{printed}"
)
