from pathlib import Path

nested = Path("shelf") / "cottage" / "books"
assert seasons(nested) == [], "a folder that does not exist has no seasons"
assert new_book(nested, "2027-spring") is True, "new_book creates missing parent folders and returns True"
first = nested / "2027-spring.txt"
assert first.read_text(encoding="utf-8") == "# Guest book 2027-spring\n", "a new book holds only its header line"
assert read_entries(first) == [], "a new book has no entries"

sign(first, "Mia", "Back next year")
assert new_book(nested, "2027-spring") is False, "new_book returns False when the book exists"
assert first.read_text(encoding="utf-8") == "# Guest book 2027-spring\nMia: Back next year\n", (
    "new_book leaves an existing book exactly as it was"
)

assert new_book(str(nested), "2026-winter") is True, "new_book takes the folder as a str too"
assert new_book(nested, "2027-summer") is True, "a second season in the same folder"
(nested / "notes.md").write_text("not a book\n", encoding="utf-8")
(nested / "photos").mkdir()
assert seasons(nested) == ["2026-winter", "2027-spring", "2027-summer"], (
    "seasons lists the .txt names without .txt, sorted, and nothing else"
)
assert seasons(str(nested)) == seasons(nested), "seasons takes a str too"
assert seasons("data") == ["2026-autumn", "2026-winter"], "seasons of the data folder ignores house-rules.md"
