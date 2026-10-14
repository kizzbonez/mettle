# A messy order file: spaces, decimals, negative and empty quantities, a blank line,
# a short line, an id in the wrong case, and a member name that contains a comma.
prices = load_prices("data/prices.json")
orders = read_orders("data/orders-messy.csv", prices)
assert orders == {
    "Okafor, Ada": {"rice-5kg": 2},
    "Ben": {"coffee-1kg": 3},
    "Chloe": {"oats-5kg": 1},
    "Eve": {"rice-5kg": 1},
}, "read_orders keeps exactly the valid lines of a messy file"

ran = run_script(args=["totals", "--orders", "data/orders-messy.csv"])
assert ran.code == 0, f"totals on a file with skipped lines still exits with status 0, not {ran.code}"
expected_warnings = {
    "WARNING: line 4: bad quantity '2.5'",
    "WARNING: line 5: bad quantity '-1'",
    "WARNING: line 6: bad quantity ''",
    "WARNING: line 9: missing member",
    "WARNING: line 10: unknown item 'tea-1kg'",
    "WARNING: line 11: bad quantity ''",
    "WARNING: line 12: unknown item 'Rice-5kg'",
}
written = {line for line in ran.err.splitlines() if line.startswith("WARNING")}
missing = expected_warnings - written
assert not missing, (
    "every skipped line of the messy file gets one warning with the right line number, reason and value; "
    f"{len(missing)} expected warning line(s) are missing or different"
)
assert not written - expected_warnings, (
    "only skipped lines get a warning (blank lines and valid lines with spaces around the quantity get none)"
)
assert "WARNING" not in ran.out, "warnings go to standard error, not standard output"
lines = ran.out.splitlines()
assert lines[:1] == ["member,subtotal,fee,total"], "totals starts with the CSV header"
assert "Ben,53.55,2.68,56.23" in lines, "totals for a member whose quantity had spaces around it"
assert '"Okafor, Ada",19.98,1.00,20.98' in lines, "totals quotes a member name that contains a comma, as csv.writer does"
assert lines == [
    "member,subtotal,fee,total",
    "Ben,53.55,2.68,56.23",
    "Chloe,11.40,0.57,11.97",
    "Eve,9.99,0.50,10.49",
    '"Okafor, Ada",19.98,1.00,20.98',
    "TOTAL,94.92,4.75,99.67",
], "totals of the messy file: members sorted by name, two decimals everywhere, and the TOTAL line"
