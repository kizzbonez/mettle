# sheet_lines is a generator that numbers every line and yields only the ones to read.
import types
from pathlib import Path

lines = sheet_lines("data/allotments.txt")
assert isinstance(lines, types.GeneratorType), "sheet_lines is a generator function (it uses yield)"
assert list(lines) == [
    (3, "06:58 robin 2"),
    (4, "07:10 goldfinch 3"),
    (5, "07:22 long-tailed tit 7"),
    (6, "25:10 blackbird 1"),
    (7, "07:35 blackbird 2"),
    (9, "07:50 goldfinch 4"),
    (10, "07:59 jay 1"),
], "sheet_lines numbers every line from 1, skips blank and comment lines, and strips the spaces around the text"

Path("crlf.txt").write_bytes(b"# head\r\n07:00 robin 1\r\n\r\n  07:05 jay 2  \r\n")
assert list(sheet_lines("crlf.txt")) == [(2, "07:00 robin 1"), (4, "07:05 jay 2")], (
    "a sheet saved with Windows line endings is read like any other"
)

Path("empty.txt").write_text("", encoding="utf-8")
assert list(sheet_lines(Path("empty.txt"))) == [], "an empty sheet yields nothing, and a Path works as well as a str"

Path("only-comments.txt").write_text("# one\n\n   \n  # two, indented\n#\n", encoding="utf-8")
assert list(sheet_lines("only-comments.txt")) == [], "blank lines and comment lines, indented or not, are skipped"

Path("accents.txt").write_bytes("07:00 rouge-gorge 1\n07:01 mésange bleue 2\n".encode("utf-8"))
assert list(sheet_lines("accents.txt"))[1] == (2, "07:01 mésange bleue 2"), "sheets are read as UTF-8 text"
