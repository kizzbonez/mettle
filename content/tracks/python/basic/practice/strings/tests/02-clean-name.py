def badge_lines(entered):
    ran = run_script(stdin=entered + "\n")
    assert ran.code == 0, "the script runs to the end without an error"
    lines = ran.out.split("\n")
    assert len(lines) == 5, "the script prints exactly four lines"
    return lines


assert badge_lines("grace hopper")[0] == "Grace Hopper", "a name typed all in lower case gets its capitals"
assert badge_lines("KATHERINE JOHNSON")[0] == "Katherine Johnson", "a name typed all in capitals is lowered after each first letter"
assert badge_lines("     mary      JACKSON    ")[0] == "Mary Jackson", (
    "spaces around and between the names shrink to a single space between them"
)
assert badge_lines("\tdorothy\t vaughan")[0] == "Dorothy Vaughan", "tabs count as spaces around and between the names"
assert badge_lines("zoë ÅSTRÖM")[0] == "Zoë Åström", "letters with accents are capitalised and lowered like any other"
