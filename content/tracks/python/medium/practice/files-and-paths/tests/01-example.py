from pathlib import Path

assert new_book("guestbook", "2027-summer") is True, "new_book('guestbook', '2027-summer') the first time, as in the example"
assert new_book("guestbook", "2027-summer") is False, "new_book('guestbook', '2027-summer') the second time, as in the example"
book = Path("guestbook") / "2027-summer.txt"
sign(book, "Zoë", "Lovely view of the bay!")
sign(book, "Tom", "The kettle: needs descaling")
assert read_entries(book) == [("Zoë", "Lovely view of the bay!"), ("Tom", "The kettle: needs descaling")], (
    "read_entries of the example book"
)
assert seasons("guestbook") == ["2027-summer"], "seasons('guestbook'), as in the example"
assert seasons("data") == ["2026-autumn", "2026-winter"], "seasons('data'), as in the example"
assert read_entries("guestbook/2026-spring.txt") == [], "read_entries of a book that does not exist, as in the example"
