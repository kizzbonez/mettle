# The three commands from the instructions.
ran = run_script(args=["data/balcony.txt"])
assert ran.code == 0, f"python solution.py data/balcony.txt should exit with status 0, not {ran.code}; stderr was:\n{ran.err}"
expected = ["count: 4", "min: 9.5", "max: 16.0", "mean: 13.0"]
assert ran.out.splitlines() == expected, (
    "standard output should be exactly:\n" + "\n".join(expected) + f"\nIt was:\n{ran.out}"
)
assert "skipping data/balcony.txt line 3: 'n/a'" in ran.err.splitlines(), (
    f"standard error should contain the line skipping data/balcony.txt line 3: 'n/a'; it was:\n{ran.err}"
)

ran = run_script(stdin="21\n19.5\n", args=["-u", "f", "-p", "2"])
assert ran.code == 0, f"reading standard input with -u f -p 2 should exit with status 0, not {ran.code}; stderr:\n{ran.err}"
expected = ["count: 2", "min: 67.10", "max: 69.80", "mean: 68.45"]
assert ran.out.splitlines() == expected, (
    "with 21 and 19.5 on standard input and -u f -p 2, standard output should be:\n" + "\n".join(expected)
    + f"\nIt was:\n{ran.out}"
)

ran = run_script(args=["data/balcony.txt", "-p", "two"])
assert ran.code == 2, f"-p two is a usage error and should exit with status 2, not {ran.code}"
assert "usage:" in ran.err, f"a usage error should print the usage to standard error; it was:\n{ran.err}"
assert ran.out == "", f"a usage error should print nothing on standard output, but printed:\n{ran.out}"
