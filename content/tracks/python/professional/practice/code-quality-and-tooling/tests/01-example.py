# The example from the instructions: data/adoptions.py.
with open("data/adoptions.py", encoding="utf-8") as file:
    source = file.read()

expected = [
    "line 6: N802 function name 'isAdopted' should be lowercase",
    "line 7: E711 comparison to None should use 'is' or 'is not'",
    "line 12: E711 comparison to None should use 'is' or 'is not'",
    "line 12: E711 comparison to None should use 'is' or 'is not'",
    "line 17: N802 function name 'NotifyOwner' should be lowercase",
]
got = lint(source)
assert got == expected, (
    "lint of data/adoptions.py should return exactly:\n" + "\n".join(expected) + "\nIt returned:\n" + "\n".join(map(str, got))
)
