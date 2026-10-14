def used_line(stdin):
    ran = run_script(stdin=stdin)
    assert ran.code == 0, "the script runs to the end without an error"
    lines = ran.out.split("\n")
    assert len(lines) > 2, "the script prints a line with the units used"
    return lines[2]


assert used_line("15020\n15333\n") == "Used this month: 313", "the units used are the new reading minus the previous one"
assert used_line("999\n1000\n") == "Used this month: 1", "a month in which a single unit was used"
assert used_line("4500\n4500\n") == "Used this month: 0", "a month in which nothing was used, so both readings are the same"
assert used_line("123456789012\n123456790000\n") == "Used this month: 988", "very large readings, which Python's whole numbers handle"
