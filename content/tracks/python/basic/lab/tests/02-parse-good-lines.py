# normalize_section and parse_headcount on lines they should accept.
assert normalize_section("altos") == "altos", "normalize_section of a plain lower-case name"
assert normalize_section("  Mezzo  Soprano   SOLOISTS ") == "mezzo soprano soloists", (
    "normalize_section should lower the case, keep single spaces between words and trim the ends"
)
assert normalize_section("   ") == "", "normalize_section of a name made only of spaces"

result = parse_headcount("First Sopranos, 2")
assert type(result) is tuple, "parse_headcount should return a tuple"
assert result == ("first sopranos", 2), "parse_headcount of a simple line with capitals"

section, count = parse_headcount("  Second   ALTOS ,  12 ")
assert section == "second altos", "parse_headcount should normalize the section name"
assert type(count) is int, "parse_headcount should return the count as an int"
assert count == 12, "parse_headcount should read the count with the spaces around it removed"

assert parse_headcount("tenors, 1") == ("tenors", 1), "parse_headcount should accept the smallest allowed count"
assert parse_headcount("basses,25") == ("basses", 25), "parse_headcount of a line with no space after the comma"
