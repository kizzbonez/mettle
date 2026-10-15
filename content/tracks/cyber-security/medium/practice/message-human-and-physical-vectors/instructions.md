Write three functions in `solution.py`. Each takes the path of an attachment (a `str` or a
`Path`) and reads the file's **bytes**: what a file is depends on its content, not its name.

1. `file_kind(path)` returns:
   - `"ooxml"` when the file starts with the zip signature `b"PK\x03\x04"` (Word, Excel and
     PowerPoint files are zips);
   - `"rtf"` when it starts with `b"{\\rtf"` (that is `{\rtf`);
   - `"pdf"` when `b"%PDF-"` appears anywhere in its first 1024 bytes (PDF readers accept junk
     before the header, and attackers use that);
   - `"unknown"` otherwise, including an empty file.
2. `active_markers(path)` returns a list of the markers found:
   - for `ooxml`, the names of the zip members whose name ends with `vbaProject.bin`, ignoring
     case (a VBA macro project), in the order `ZipFile.namelist()` gives;
   - for `rtf`, the control words of `RTF_WORDS` (`\object`, `\objdata`, `\objupdate`) that
     appear in the file, in that order;
   - for `pdf`, the keys of `PDF_KEYS` that appear in the file, in that order;
   - `[]` for `unknown`.
3. `verdict(path)` returns:
   - `"block"` when the kind is `unknown`, or when the file's extension (its last suffix,
     ignoring case) is not one of `EXTENSIONS[kind]`: a zip called `.pdf`, an RTF called `.doc`
     and a plain `.zip` are all blocked;
   - otherwise `"sandbox"` when it has active markers;
   - otherwise `"deliver"`.

**Example.** The test first builds two Office files with `zipfile`: `invoice-0412.docm`, which
holds `word/vbaProject.bin`, and `rota.docx`, which does not.

```python
active_markers("invoice-0412.docm")      # ['word/vbaProject.bin']
verdict("invoice-0412.docm")             # 'sandbox'
verdict("rota.docx")                     # 'deliver'
active_markers("data/order.rtf")         # ['\\object', '\\objdata', '\\objupdate']
active_markers("data/statement.pdf")     # ['/JavaScript', '/JS', '/OpenAction']
verdict("data/minutes.pdf")              # 'deliver'
file_kind("data/remittance.pdf")         # 'rtf'
verdict("data/remittance.pdf")           # 'block'
```

**Tip.** `Path(path).read_bytes()`, `bytes.startswith`, `b"..." in data[:1024]`,
`word.encode() in data`, and `with zipfile.ZipFile(path) as archive:`. `Path(path).suffix`
is the last suffix.
