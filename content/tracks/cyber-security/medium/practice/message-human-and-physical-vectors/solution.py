"""First triage of quarantined email attachments, by content rather than by name."""
import zipfile
from pathlib import Path

RTF_WORDS = ["\\object", "\\objdata", "\\objupdate"]
PDF_KEYS = ["/JavaScript", "/JS", "/OpenAction", "/AA", "/Launch", "/EmbeddedFile"]
EXTENSIONS = {
    "ooxml": {".docx", ".docm", ".xlsx", ".xlsm", ".pptx", ".pptm"},
    "rtf": {".rtf"},
    "pdf": {".pdf"},
}


def file_kind(path):
    """Return "ooxml", "rtf", "pdf" or "unknown" from the first bytes of the file."""
    data = Path(path).read_bytes()
    if data.startswith(b"PK\x03\x04"):
        return "ooxml"
    if data.startswith(b"{\\rtf"):
        return "rtf"
    if b"%PDF-" in data[:1024]:
        return "pdf"
    return "unknown"


def active_markers(path):
    """Return the markers of active content found in the file, in the order of the rules."""
    kind = file_kind(path)
    if kind == "ooxml":
        with zipfile.ZipFile(path) as archive:
            return [name for name in archive.namelist() if name.lower().endswith("vbaproject.bin")]
    data = Path(path).read_bytes()
    if kind == "rtf":
        return [word for word in RTF_WORDS if word.encode() in data]
    if kind == "pdf":
        return [key for key in PDF_KEYS if key.encode() in data]
    return []


def verdict(path):
    """Return "block", "sandbox" or "deliver" for an attachment."""
    kind = file_kind(path)
    if kind == "unknown" or Path(path).suffix.lower() not in EXTENSIONS[kind]:
        return "block"
    if active_markers(path):
        return "sandbox"
    return "deliver"
