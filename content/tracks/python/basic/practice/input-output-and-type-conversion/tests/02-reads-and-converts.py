def first_line(stdin):
    ran = run_script(stdin=stdin)
    assert ran.code == 0, "the script runs to the end without an error"
    lines = ran.out.split("\n")
    assert len(lines) == 5, "the script prints exactly four lines and no prompts"
    return lines[0]


assert first_line("100\n10\n3\n") == "Bill: 100.00 | Tip rate: 10% | People: 3", (
    "the first line shows the bill with two decimals, the tip rate and the people, separated by ' | '"
)
assert first_line("  19.99 \n 18 \n  3\n") == "Bill: 19.99 | Tip rate: 18% | People: 3", (
    "spaces around the numbers typed in are ignored by the conversions"
)
assert first_line("1e2\n12\n7\n") == "Bill: 100.00 | Tip rate: 12% | People: 7", (
    "a bill written in scientific notation is read as a float"
)
assert first_line("0.5\n20\n2\n") == "Bill: 0.50 | Tip rate: 20% | People: 2", "a bill below 1 keeps its leading zero and two decimals"
