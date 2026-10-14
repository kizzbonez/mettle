def money_lines(stdin):
    ran = run_script(stdin=stdin)
    assert ran.code == 0, "the script runs to the end without an error"
    lines = ran.out.split("\n")
    assert len(lines) == 5, "the script prints exactly four lines and no prompts"
    return lines[1:4]


assert money_lines("100\n10\n3\n") == ["Tip: 10.00", "Total: 110.00", "Each pays: 36.67"], (
    "a share that does not divide evenly is shown rounded to two decimals"
)
assert money_lines("12\n0\n1\n") == ["Tip: 0.00", "Total: 12.00", "Each pays: 12.00"], (
    "no tip, and one person paying the whole bill"
)
assert money_lines("83.45\n12\n5\n") == ["Tip: 10.01", "Total: 93.46", "Each pays: 18.69"], (
    "the tip is the bill times the percentage divided by 100, and each share is the total divided by the people"
)
assert money_lines("19.99\n18\n3\n") == ["Tip: 3.60", "Total: 23.59", "Each pays: 7.86"], (
    "a tip with more decimals than cents is shown rounded to two"
)
assert money_lines("10.14\n18\n2\n") == ["Tip: 1.83", "Total: 11.97", "Each pays: 5.98"], (
    "the amounts are rounded only when they are printed, not before the next calculation"
)
