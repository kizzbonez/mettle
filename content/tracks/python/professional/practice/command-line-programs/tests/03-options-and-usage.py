# --unit and --precision in long and short form, and every usage error exiting with status 2.
from pathlib import Path

Path("t3-week.txt").write_text("0\n100\n-40\n36\n", encoding="utf-8")

ran = run_script(args=["--unit", "f", "t3-week.txt"])
assert ran.code == 0, f"--unit f should exit with status 0, not {ran.code}; stderr:\n{ran.err}"
assert ran.out.splitlines() == ["count: 4", "min: -40.0", "max: 212.0", "mean: 75.2"], (
    f"--unit f should convert every reading to Fahrenheit before the summary; standard output was:\n{ran.out}"
)

ran = run_script(args=["t3-week.txt", "-u", "c", "--precision", "3"])
assert ran.code == 0, f"-u c --precision 3 should exit with status 0, not {ran.code}; stderr:\n{ran.err}"
assert ran.out.splitlines() == ["count: 4", "min: -40.000", "max: 100.000", "mean: 24.000"], (
    f"--precision 3 should show three decimals; standard output was:\n{ran.out}"
)

ran = run_script(args=["-p", "0", "t3-week.txt"])
assert ran.out.splitlines() == ["count: 4", "min: -40", "max: 100", "mean: 24"], (
    f"-p 0 should show no decimals at all; standard output was:\n{ran.out}"
)

usage_errors = [
    ["t3-week.txt", "-u", "k"],
    ["t3-week.txt", "--unit", "F"],
    ["t3-week.txt", "-p", "-1"],
    ["t3-week.txt", "-p", "1.5"],
    ["t3-week.txt", "--precision"],
    ["t3-week.txt", "--colour"],
]
for args in usage_errors:
    ran = run_script(args=args)
    assert ran.code == 2, f"python solution.py {' '.join(args)} is a usage error and should exit with status 2, not {ran.code}"
    assert "usage:" in ran.err, f"python solution.py {' '.join(args)} should print the usage on standard error"
    assert ran.out == "", f"python solution.py {' '.join(args)} should print nothing on standard output"
