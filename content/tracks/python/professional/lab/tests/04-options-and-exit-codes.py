# --fee, usage errors (status 2) and run-time errors (status 1).
ran = run_script(args=["totals", "--fee", "2.5"])
assert ran.code == 0, f"totals --fee 2.5 exits with status 0, not {ran.code}"
assert ran.out.splitlines() == [
    "member,subtotal,fee,total",
    "Ana,55.05,1.38,56.43",
    "Ben,17.85,0.45,18.30",
    "Chloe,16.50,0.41,16.91",
    "Dev,48.21,1.21,49.42",
    "TOTAL,137.61,3.45,141.06",
], "totals --fee 2.5 applies a fee percentage with decimals to every member and to the TOTAL line"

ran = run_script(args=["invoice", "Chloe", "--fee", "0"])
assert ran.code == 0 and "Fee: 0.00" in ran.out.splitlines(), "invoice with --fee 0 shows a fee of 0.00"

for args, what in [
    (["totals", "--fee", "abc"], "a --fee that is not a number"),
    (["totals", "--fee", "150"], "a --fee above 100"),
    (["totals", "--fee", "-1"], "a negative --fee"),
    ([], "no subcommand"),
    (["refund"], "an unknown subcommand"),
    (["invoice"], "invoice without a member"),
]:
    ran = run_script(args=args)
    assert ran.code == 2, f"{what} is a usage error with exit status 2, but the status was {ran.code}"
    assert ran.out == "", f"{what} prints nothing on standard output"
    assert "usage:" in ran.err, f"{what} shows argparse's usage message on standard error"

for args, what in [
    (["totals", "--orders", "data/no-such-file.csv"], "an order file that does not exist"),
    (["invoice", "Ana", "--prices", "data/no-such-file.json"], "a price file that does not exist"),
    (["totals", "--prices", "data/prices-broken.json"], "a price file that is not valid JSON"),
    (["totals", "--prices", "data/prices-comma.json"], "a price file with a price that is not a number"),
    (["invoice", "Zed"], "an invoice for a member with no orders"),
]:
    ran = run_script(args=args)
    assert ran.code == 1, f"{what} exits with status 1, but the status was {ran.code}"
    assert ran.out == "", f"{what} prints nothing on standard output"
    assert "ERROR: " in ran.err, f"{what} logs an ERROR line on standard error"
    assert "Traceback" not in ran.err, f"{what} is reported as a log line, not a traceback"
