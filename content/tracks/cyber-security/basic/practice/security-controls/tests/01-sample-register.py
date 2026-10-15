# The example from the instructions: the firm's register in data/register.csv.
rows = read_register("data/register.csv")
gaps = find_gaps(rows)
assert isinstance(gaps, dict), "find_gaps should return a dict"
expected = {
    "file server": ["corrective"],
    "office": ["corrective"],
    "laptops": ["detective"],
    "email": ["detective", "corrective"],
}
assert gaps == expected, f"gaps found in data/register.csv: got {gaps!r}"
assert list(gaps) == list(expected), "assets should appear in the order they first appear in the register"

ran = run_script()
assert ran.out == (
    "file server: missing corrective\n"
    "office: missing corrective\n"
    "laptops: missing detective\n"
    "email: missing detective, corrective\n"
), f"python solution.py should print one line per asset with gaps, got:\n{ran.out}{ran.err}"
