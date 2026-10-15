import argparse

import pandas as pd

parser = build_parser()
assert isinstance(parser, argparse.ArgumentParser), "build_parser returns an argparse.ArgumentParser"
args = parser.parse_args(["data/tickets.csv"])
assert args.tickets == "data/tickets.csv" and args.min_kg == 5.0, "--min-kg defaults to 5.0"
assert parser.parse_args(["x.csv", "--min-kg", "0.5"]).min_kg == 0.5, "--min-kg is read as a float"

ran = run_script(args=["data/tickets.csv", "--min-kg", "0"])
expected = pd.DataFrame({
    "material": ["cardboard", "garden waste", "glass", "metal", "wood"],
    "tickets": [2, 2, 2, 2, 1],
    "total_kg": [21.5, 184.7, 26.5, 250.0, 95.5],
})
assert ran.code == 0 and ran.out == expected.to_string(index=False) + "\n", (
    "--min-kg 0 counts every ticket with a weight, and only the table goes to standard output"
)
assert "INFO: " not in ran.out and "INFO: " in ran.err, "log lines go to standard error, not standard output"

for args, case in [
    (["data/tickets.csv", "--min-kg", "1000"], "no ticket heavy enough"),
    (["no-such-file.csv"], "a file that does not exist"),
]:
    ran = run_script(args=args)
    assert ran.code == 1, f"{case} gives exit status 1"
    assert ran.out == "", f"{case} prints nothing on standard output"
    assert "ERROR: " in ran.err and "Traceback" not in ran.err, f"{case} gives an ERROR line instead of a traceback"

ran = run_script(args=["data/tickets.csv", "--min-kg", "heavy"])
assert ran.code == 2 and "Traceback" not in ran.err, "a --min-kg that is not a number is a usage error, status 2"
