ran = run_script()
assert ran.code == 0, "the script runs to its last line without stopping on an error"
assert "Staff" not in ran.out and "spare key" not in ran.out, "the note for the staff is not printed on the sign"

# The note must stay in the file, turned into a comment.
source = open("solution.py", encoding="utf-8").read()
kept_as_comment = False
for line in source.split("\n"):
    if line.strip().startswith("#") and "spare key" in line:
        kept_as_comment = True
assert kept_as_comment, "the staff note is still in the file, as a comment that starts with #"
