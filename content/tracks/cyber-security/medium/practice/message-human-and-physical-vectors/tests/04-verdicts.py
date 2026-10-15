# verdict(): extensions in any case, masquerading files, archives, unknown content.
import zipfile
from pathlib import Path


def office(name, macro):
    with zipfile.ZipFile(name, "w") as z:
        z.writestr("[Content_Types].xml", "<Types/>")
        z.writestr("word/document.xml", "<document/>")
        if macro:
            z.writestr("word/vbaProject.bin", b"\xd0\xcf\x11\xe0")


office("t4-Report.DOCM", macro=True)
office("t4-letter.docx", macro=True)
office("t4-clean.Docx", macro=False)
office("t4-invoice.pdf", macro=False)
office("t4-photos.zip", macro=False)
office("t4-statement.pdf.docx", macro=False)
office("t4-noext", macro=False)
Path("t4-quote.doc").write_bytes(b"{\\rtf1 {\\object\\objupdate{\\*\\objdata 01}}}")
Path("t4-quote.RTF").write_bytes(b"{\\rtf1 Plain quote\\par}")
Path("t4-scan.PDF").write_bytes(b"%PDF-1.5\n%%EOF\n")
Path("t4-payload.pdf").write_bytes(b"MZ\x90\x00\x03\x00\x00\x00")

cases = {
    "t4-Report.DOCM": ("sandbox", "a .DOCM in upper case with a VBA project"),
    "t4-letter.docx": ("sandbox", "a .docx that nonetheless holds a VBA project"),
    "t4-clean.Docx": ("deliver", "a clean .Docx"),
    "t4-invoice.pdf": ("block", "a zip named .pdf"),
    "t4-photos.zip": ("block", "a plain .zip archive"),
    "t4-statement.pdf.docx": ("deliver", "a clean Office file whose last suffix is .docx"),
    "t4-noext": ("block", "an Office file without an extension"),
    "t4-quote.doc": ("block", "an RTF named .doc"),
    "t4-quote.RTF": ("deliver", "a plain RTF named .RTF"),
    "t4-scan.PDF": ("deliver", "a clean PDF named .PDF"),
    "t4-payload.pdf": ("block", "an executable named .pdf"),
}
for name, (expected, what) in cases.items():
    assert verdict(name) == expected, f"verdict: {what}"
assert verdict(Path("t4-clean.Docx")) == "deliver", "verdict should accept a Path"
