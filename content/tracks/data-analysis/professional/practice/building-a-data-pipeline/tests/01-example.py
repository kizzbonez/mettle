import pandas as pd

expected = pd.DataFrame({
    "material": ["cardboard", "garden waste", "glass", "metal", "wood"],
    "tickets": [1, 2, 1, 2, 1],
    "total_kg": [18.5, 184.7, 22.0, 250.0, 95.5],
})
check_frame(totals(read_tickets("data/tickets.csv"), 5.0), expected, "totals summarises the sample's tickets")

ran = run_script(args=["data/tickets.csv"])
assert "Traceback" not in ran.err, "python solution.py data/tickets.csv runs without a traceback"
assert ran.code == 0, "python solution.py data/tickets.csv exits with status 0"
assert ran.out == expected.to_string(index=False) + "\n", (
    "python solution.py data/tickets.csv prints the sample's table, and nothing else, on standard output"
)
assert ran.err.count("INFO: ") >= 2, "the program logs its steps at INFO level on standard error"

ran = run_script(args=["data/old-format.csv"])
assert ran.code == 1 and ran.out == "", "an export without the required columns exits with status 1 and prints nothing"
assert "ERROR: " in ran.err and "Traceback" not in ran.err, (
    "an export without the required columns gives an ERROR line, not a traceback"
)
