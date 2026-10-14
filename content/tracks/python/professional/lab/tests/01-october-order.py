# The October order from the instructions: totals, Ana's invoice and an unknown member.
ran = run_script(args=["totals"])
assert ran.code == 0, f"totals should exit with status 0; it exited with {ran.code} and wrote:\n{ran.err}"
expected = [
    "member,subtotal,fee,total",
    "Ana,55.05,2.75,57.80",
    "Ben,17.85,0.89,18.74",
    "Chloe,16.50,0.83,17.33",
    "Dev,48.21,2.41,50.62",
    "TOTAL,137.61,6.88,144.49",
]
assert ran.out.splitlines() == expected, (
    "totals should print exactly these lines on standard output:\n" + "\n".join(expected)
    + f"\nIt printed:\n{ran.out}"
)
warnings = [
    "WARNING: line 6: unknown item 'tea-1kg'",
    "WARNING: line 8: bad quantity 'two'",
    "WARNING: line 10: missing member",
    "WARNING: line 11: bad quantity '0'",
]
for warning in warnings:
    assert warning in ran.err.splitlines(), (
        f"standard error should contain the line {warning!r}; it was:\n{ran.err}"
    )

ran = run_script(args=["invoice", "Ana"])
assert ran.code == 0, f"invoice Ana should exit with status 0; it exited with {ran.code} and wrote:\n{ran.err}"
expected = [
    "Invoice for Ana",
    "lentils-2kg 3 x 6.95 = 20.85",
    "oats-5kg 3 x 11.40 = 34.20",
    "Subtotal: 55.05",
    "Fee: 2.75",
    "Total: 57.80",
]
assert ran.out.splitlines() == expected, (
    "invoice Ana should print exactly these lines on standard output:\n" + "\n".join(expected)
    + f"\nIt printed:\n{ran.out}"
)

ran = run_script(args=["invoice", "Zed"])
assert ran.code == 1, f"invoice Zed (no orders) should exit with status 1, not {ran.code}"
assert ran.out == "", f"invoice Zed should print nothing on standard output, but printed:\n{ran.out}"
assert "ERROR: no orders for Zed" in ran.err, f"invoice Zed should log 'ERROR: no orders for Zed'; stderr was:\n{ran.err}"
