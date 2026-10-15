# file_kind(): signatures at the start, a PDF header after junk, and files that are none of these.
import zipfile
from pathlib import Path

with zipfile.ZipFile("t2-archive.zip", "w") as z:
    z.writestr("readme.txt", "hello")

files = {
    "t2-archive.zip": (None, "ooxml", "a zip archive starts with PK\\x03\\x04"),
    "t2-plain.rtf": (b"{\\rtf1\\ansi Hello\\par}", "rtf", "an RTF document"),
    "t2-junk.pdf": (b"\x00" * 900 + b"%PDF-1.7\n%%EOF\n", "pdf", "a PDF header after 900 bytes of junk"),
    "t2-late.pdf": (b"\x00" * 1100 + b"%PDF-1.7\n%%EOF\n", "unknown", "a PDF header after the first 1024 bytes"),
    "t2-empty.pdf": (b"", "unknown", "an empty file"),
    "t2-notes.txt": (b"Meeting notes: bring the {\\rtf sample\n", "unknown", "text that only contains {\\rtf later on"),
    "t2-lower.pdf": (b"%pdf-1.7\n", "unknown", "a header written %pdf- in lower case"),
    "t2-pk.docx": (b"PK\x05\x06" + b"\x00" * 18, "unknown", "PK followed by another signature than \\x03\\x04"),
    "t2-html.pdf": (b"<html><body>%PDF-1.4 sample</body></html>", "pdf", "%PDF- inside the first 1024 bytes of an HTML file"),
}
for name, (content, kind, what) in files.items():
    if content is not None:
        Path(name).write_bytes(content)
    assert file_kind(name) == kind, f"file_kind: {what}"

assert file_kind(Path("t2-plain.rtf")) == "rtf", "file_kind should accept a Path"
