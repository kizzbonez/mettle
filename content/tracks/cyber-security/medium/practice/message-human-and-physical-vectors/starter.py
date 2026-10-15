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
    # YOUR CODE: read the bytes; never look at the name here.
    raise NotImplementedError


def active_markers(path):
    """Return the markers of active content found in the file, in the order of the rules."""
    # YOUR CODE: VBA projects in the zip, RTF_WORDS in an RTF, PDF_KEYS in a PDF.
    raise NotImplementedError


def verdict(path):
    """Return "block", "sandbox" or "deliver" for an attachment."""
    # YOUR CODE: compare the extension with EXTENSIONS, then look for markers.
    raise NotImplementedError
