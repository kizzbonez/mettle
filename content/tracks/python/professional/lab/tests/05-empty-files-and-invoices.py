# An order file with only a header, and invoices for awkward member names.
ran = run_script(args=["totals", "--orders", "data/orders-empty.csv"])
assert ran.code == 0, f"totals on an order file with only the header exits with status 0, not {ran.code}"
assert ran.out.splitlines() == ["member,subtotal,fee,total", "TOTAL,0.00,0.00,0.00"], (
    "totals on an order file with only the header prints the header and a TOTAL line of zeros"
)
assert "WARNING" not in ran.err, "an order file with only the header produces no warnings"

ran = run_script(args=["invoice", "  Dev  "])
assert ran.code == 0, f"invoice with spaces around the member name exits with status 0, not {ran.code}"
assert ran.out.splitlines() == [
    "Invoice for Dev",
    "olive-oil-1l 1 x 8.25 = 8.25",
    "rice-5kg 4 x 9.99 = 39.96",
    "Subtotal: 48.21",
    "Fee: 2.41",
    "Total: 50.62",
], "invoice strips the member argument, combines the member's lines, and sorts the items by id"

ran = run_script(args=["invoice", "Okafor, Ada", "--orders", "data/orders-messy.csv", "--fee", "10"])
assert ran.code == 0, f"invoice for a member whose name contains a comma exits with status 0, not {ran.code}"
assert ran.out.splitlines() == [
    "Invoice for Okafor, Ada",
    "rice-5kg 2 x 9.99 = 19.98",
    "Subtotal: 19.98",
    "Fee: 2.00",
    "Total: 21.98",
], "invoice for a member whose name contains a comma, with another order file and fee"

ran = run_script(args=["invoice", "Dev", "--orders", "data/orders-messy.csv"])
assert ran.code == 1, "invoice for a member whose every line was skipped exits with status 1"
assert ran.out == "", "invoice for a member whose every line was skipped prints nothing on standard output"
assert "ERROR: no orders for Dev" in ran.err, "invoice for a member whose every line was skipped logs 'no orders for' the member"

ran = run_script(args=["invoice", "ana"])
assert ran.code == 1, "member names are compared exactly, so a name in the wrong case has no orders"
