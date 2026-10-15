# The example from the instructions.
import zipfile

CT = b'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'
DOC = b'<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'

with zipfile.ZipFile("invoice-0412.docm", "w") as z:
    z.writestr("[Content_Types].xml", CT)
    z.writestr("word/document.xml", DOC)
    z.writestr("word/vbaProject.bin", b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1" + b"\x00" * 56)
with zipfile.ZipFile("rota.docx", "w") as z:
    z.writestr("[Content_Types].xml", CT)
    z.writestr("word/document.xml", DOC)

assert file_kind("invoice-0412.docm") == "ooxml", "file_kind of a zip-based Office file should be 'ooxml'"
assert active_markers("invoice-0412.docm") == ["word/vbaProject.bin"], "active_markers('invoice-0412.docm') should list its VBA project"
assert verdict("invoice-0412.docm") == "sandbox", "verdict('invoice-0412.docm') should be 'sandbox'"
assert active_markers("rota.docx") == [], "active_markers('rota.docx') should be []"
assert verdict("rota.docx") == "deliver", "verdict('rota.docx') should be 'deliver'"
assert active_markers("data/order.rtf") == ["\\object", "\\objdata", "\\objupdate"], (
    "active_markers('data/order.rtf') should list the three RTF control words in order"
)
assert verdict("data/order.rtf") == "sandbox", "verdict('data/order.rtf') should be 'sandbox'"
assert active_markers("data/statement.pdf") == ["/JavaScript", "/JS", "/OpenAction"], (
    "active_markers('data/statement.pdf') should list /JavaScript, /JS and /OpenAction"
)
assert verdict("data/minutes.pdf") == "deliver", "verdict('data/minutes.pdf') should be 'deliver'"
assert file_kind("data/remittance.pdf") == "rtf", "file_kind('data/remittance.pdf') should look at the content: it is 'rtf'"
assert verdict("data/remittance.pdf") == "block", "verdict('data/remittance.pdf') should be 'block': an RTF named .pdf"
