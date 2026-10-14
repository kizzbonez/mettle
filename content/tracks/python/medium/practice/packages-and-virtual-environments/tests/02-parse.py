assert parse_requirements("") == {}, "an empty file has no requirements"
assert parse_requirements("# only a comment\n\n   \n") == {}, "comment lines and blank lines are skipped"
assert parse_requirements("rich") == {"rich": ""}, "a name without a specifier, on a last line without a newline"

text = (
    "  Flask ~= 3.1.0\n"
    "\n"
    "# pinned after the 2.0 upgrade\n"
    "pandas!=2.2.0,>=2.1   # bug in 2.2.0\n"
    "TOMLI_W   == 1.2.*\n"
    "httpx<1\n"
)
parsed = parse_requirements(text)
assert list(parsed) == ["flask", "pandas", "tomli_w", "httpx"], "names are lower-cased and kept in the order of the file"
assert parsed["flask"] == "~=3.1.0", "spaces around and inside the specifier are removed"
assert parsed["pandas"] == "!=2.2.0,>=2.1", "a comment after a requirement is dropped and the clauses stay in order"
assert parsed["tomli_w"] == "==1.2.*", "a wildcard specifier is kept as written, without spaces"
assert parsed["httpx"] == "<1", "a specifier that starts with < is found"
assert parse_requirements("Café-Tools>=1\n") == {"café-tools": ">=1"}, "a name with other characters is kept whole, lower-cased"
