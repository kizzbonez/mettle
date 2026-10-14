from pathlib import Path

target = Path("signing-test.txt")
sign("signing-test.txt", "Ana", "First!")
assert target.read_text(encoding="utf-8") == "Ana: First!\n", "sign creates a missing file with one line ending in a newline"
sign(target, "Bo", "Second")
sign(target, "Ana", "Back again")
assert target.read_text(encoding="utf-8") == "Ana: First!\nBo: Second\nAna: Back again\n", (
    "sign adds each line at the end and keeps what was there"
)

kept = Path("signing-kept.txt")
kept.write_text("# Guest book 2025-spring\nOld: entry\n", encoding="utf-8")
sign(kept, "New", "entry")
assert kept.read_text(encoding="utf-8") == "# Guest book 2025-spring\nOld: entry\nNew: entry\n", "sign never empties an existing book"

unicode_book = Path("signing-unicode.txt")
sign(unicode_book, "Zoë", "Ça va 🌊")
assert unicode_book.read_bytes() == "Zoë: Ça va 🌊\n".encode("utf-8"), "sign writes UTF-8"
