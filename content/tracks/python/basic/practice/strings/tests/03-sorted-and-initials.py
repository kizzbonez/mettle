def badge_lines(entered):
    ran = run_script(stdin=entered + "\n")
    assert ran.code == 0, "the script runs to the end without an error"
    lines = ran.out.split("\n")
    assert len(lines) == 5, "the script prints exactly four lines"
    return lines


lines = badge_lines("  grace HOPPER ")
assert lines[1] == "HOPPER, Grace", "the sorted form is the last name in capitals, a comma, a space and the first name"
assert lines[2] == "G.H.", "the initials are the first letter of each name, each followed by a dot"

lines = badge_lines("jo li")
assert lines[1] == "LI, Jo", "the sorted form of short names"
assert lines[2] == "J.L.", "the initials of short names"

lines = badge_lines("élodie DURAND")
assert lines[1] == "DURAND, Élodie", "the sorted form of a first name that starts with an accented letter"
assert lines[2] == "É.D.", "the initials keep an accented first letter as a capital"
