# Exit status 1 with a clean standard output: missing files and no readings at all.
from pathlib import Path

Path("t4-good.txt").write_text("5\n6\n", encoding="utf-8")
Path("t4-junk.txt").write_text("n/a\n\nerror\n", encoding="utf-8")
Path("t4-empty.txt").write_text("", encoding="utf-8")

ran = run_script(args=["t4-good.txt", "t4-missing.txt"])
assert ran.code == 1, f"a file that cannot be opened should give exit status 1, not {ran.code}"
assert ran.out == "", f"after a missing file nothing should be printed on standard output, even for the good file; it printed:\n{ran.out}"
assert "error:" in ran.err and "Traceback" not in ran.err, (
    f"a missing file should be reported as an 'error: ...' line on standard error, without a traceback; it was:\n{ran.err}"
)

ran = run_script(args=["t4-junk.txt", "t4-empty.txt"])
assert ran.code == 1, f"files without a single reading should give exit status 1, not {ran.code}"
assert ran.out == "", f"with no readings nothing should be printed on standard output; it printed:\n{ran.out}"
assert "error: no readings" in ran.err.splitlines(), f"standard error should contain the line 'error: no readings'; it was:\n{ran.err}"
assert "skipping t4-junk.txt line 3: 'error'" in ran.err.splitlines(), (
    f"bad lines should still be reported before giving up; standard error was:\n{ran.err}"
)

ran = run_script(stdin="")
assert ran.code == 1 and ran.out == "", "empty standard input has no readings: status 1 and nothing on standard output"

ran = run_script(args=["t4-good.txt"])
assert ran.code == 0 and ran.err == "", (
    f"a file with only good readings should exit 0 and write nothing to standard error; it exited {ran.code} with:\n{ran.err}"
)
