def takings_line(stdin):
    ran = run_script(stdin=stdin)
    assert ran.code == 0, "the script runs to the end without an error"
    lines = ran.out.split("\n")
    assert len(lines) == 5, "the script prints exactly four lines"
    return lines[3]


assert takings_line("30\n10\n0.1\n") == "Takings: 0.3", (
    "takings whose exact float has a long tail of digits are rounded to two decimal places"
)
assert takings_line("9\n3\n1.15\n") == "Takings: 3.45", (
    "takings that come out just below a value with two decimals are rounded to it"
)
assert takings_line("49\n6\n2.5\n") == "Takings: 20.0", "only the full boxes are sold, not the box with the cookie left over"
assert takings_line("45\n6\n2\n") == "Takings: 14.0", "a whole-number price is still read as a float, so the takings are a float"
assert takings_line("5\n12\n3\n") == "Takings: 0.0", "no full boxes take no money"
