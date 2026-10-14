from pathlib import Path

assert read_entries("data/2026-autumn.txt") == [
    ("Hannah", "Saw seals from the kitchen window."),
    ("Jonas", "Wi-Fi password: on the fridge, thanks!"),
    ("Amélie", "Merci pour tout"),
], "read_entries skips comments and blank lines, strips each line and splits at the first ': '"
assert read_entries(Path("data") / "2026-winter.txt") == [("Søren", "Stormy, cosy, perfect.")], "read_entries takes a Path too"
assert read_entries("reading-nowhere/none.txt") == [], "a file in a folder that does not exist gives []"

windows = Path("reading-windows.txt")
windows.write_bytes("Ana: hi\r\n\r\nBo: see you\r\n".encode("utf-8"))
assert read_entries(windows) == [("Ana", "hi"), ("Bo", "see you")], "Windows line endings do not end up in the messages"

odd = Path("reading-odd.txt")
odd.write_text("   \n\t\n#Ana: not an entry\nno separator here\nAna:no space\nTom: Time: 10:30\n", encoding="utf-8")
assert read_entries(odd) == [("Tom", "Time: 10:30")], "lines that are blank, comments or without ': ' are not entries"

empty = Path("reading-empty.txt")
empty.write_text("", encoding="utf-8")
assert read_entries(empty) == [], "an empty file has no entries"
