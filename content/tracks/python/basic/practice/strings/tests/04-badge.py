def badge_line(entered):
    ran = run_script(stdin=entered + "\n")
    assert ran.code == 0, "the script runs to the end without an error"
    lines = ran.out.split("\n")
    assert len(lines) == 5, "the script prints exactly four lines"
    return lines[3]


line = badge_line("grace hopper")
assert line.startswith("|") and line.endswith("|"), "the badge line starts and ends with a bar"
assert len(line) == 22, "the space between the bars is 20 characters wide"
assert line == "|    Grace Hopper    |", "a name centred with equal space on each side"

assert badge_line("bo li") == "|       Bo Li        |", (
    "when the spaces cannot be shared equally, the extra one goes on the right, as ^ in an f-string does"
)
assert badge_line("maximilian oberstein") == "|Maximilian Oberstein|", "a name exactly 20 characters long fills the badge"
assert badge_line("bartholomew huntington") == "|Bartholomew Huntington|", (
    "a name longer than 20 characters is printed in full, with no spaces added"
)
