# active_markers(): VBA projects in any case and folder, RTF words and PDF keys in rule order.
import zipfile
from pathlib import Path

with zipfile.ZipFile("t3-book.xlsm", "w") as z:
    z.writestr("[Content_Types].xml", "<Types/>")
    z.writestr("xl/workbook.xml", "<workbook/>")
    z.writestr("xl/VBAProject.BIN", b"\xd0\xcf\x11\xe0")
    z.writestr("xl/vbaProject.bin.txt", "not a project")
    z.writestr("customUI/vbaProject.bin", b"\xd0\xcf\x11\xe0")
assert active_markers("t3-book.xlsm") == ["xl/VBAProject.BIN", "customUI/vbaProject.bin"], (
    "every member whose name ends with vbaProject.bin, ignoring case, in archive order"
)

with zipfile.ZipFile("t3-deck.pptx", "w") as z:
    z.writestr("ppt/presentation.xml", "<p/>")
    z.writestr("ppt/media/image1.png", b"\x89PNG")
assert active_markers("t3-deck.pptx") == [], "a presentation without a VBA project has no markers"

Path("t3-data-only.rtf").write_bytes(b"{\\rtf1 {\\*\\objdata 0105000002000000}}")
assert active_markers("t3-data-only.rtf") == ["\\objdata"], "an RTF with only \\objdata"
Path("t3-reordered.rtf").write_bytes(b"{\\rtf1 {\\objupdate\\object{\\*\\objdata 01}}}")
assert active_markers("t3-reordered.rtf") == ["\\object", "\\objdata", "\\objupdate"], (
    "RTF words are listed in the order of RTF_WORDS, not the order in the file"
)
Path("t3-text.rtf").write_bytes(b"{\\rtf1 The objects are in the warehouse.\\par}")
assert active_markers("t3-text.rtf") == [], "the word objects in plain text is not a control word"

Path("t3-actions.pdf").write_bytes(
    b"%PDF-1.6\n1 0 obj << /Type /Catalog /AA << /O 2 0 R >> /Names << /EmbeddedFiles 3 0 R >> >> endobj\n"
    b"2 0 obj << /S /Launch /F (cmd.exe) >> endobj\n%%EOF\n"
)
assert active_markers("t3-actions.pdf") == ["/AA", "/Launch", "/EmbeddedFile"], (
    "a PDF with /AA, /Launch and /EmbeddedFiles, listed in the order of PDF_KEYS"
)
Path("t3-plain.pdf").write_bytes(b"%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n%%EOF\n")
assert active_markers("t3-plain.pdf") == [], "a PDF with no active keys"
Path("t3-other.bin").write_bytes(b"MZ\x90\x00 /JavaScript \\object")
assert active_markers("t3-other.bin") == [], "a file of unknown kind has no markers, whatever it contains"
