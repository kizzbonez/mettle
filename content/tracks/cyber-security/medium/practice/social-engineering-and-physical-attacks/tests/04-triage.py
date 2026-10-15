# triage(): scores at the verdict boundaries, ties by file name, names without folders.
from pathlib import Path

GW = "mx1.brightwell-build.example"


def write(name, sender, subject, auth="spf=pass; dkim=pass; dmarc=pass", reply_to=None):
    lines = [f"Authentication-Results: {GW}; {auth}", f"From: {sender}"]
    if reply_to:
        lines.append(f"Reply-To: {reply_to}")
    lines += ["To: someone@brightwell-build.example", f"Subject: {subject}", "", "Text."]
    Path("t4-reports").mkdir(exist_ok=True)
    path = Path("t4-reports") / name
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


paths = [
    write("c.eml", "HR <hr@brightwel-build.example>", "Policy update", reply_to="hr@mailbox.example"),
    write("b.eml", "Quotes <q@supplier.example>", "Quote 19", reply_to="q@other.example"),
    write("a.eml", "Quotes <q@supplier2.example>", "Quote 20", auth="spf=pass; dkim=none; dmarc=pass"),
    write("d.eml", "Ops <ops@brightwell-build.example>", "Concrete pour today"),
    write("e.eml", "Ops <ops@brightwell-build.example>", "Concrete pour on Monday"),
    write("f.eml", "Ruth Calloway <ruth@brightwel-build.example>", "Hello"),
]
expected = [
    ("c.eml", 5, "phishing"),
    ("f.eml", 5, "phishing"),
    ("a.eml", 2, "suspicious"),
    ("b.eml", 2, "suspicious"),
    ("d.eml", 1, "benign"),
    ("e.eml", 0, "benign"),
]
got = triage([str(path) for path in paths])
assert [row[1] for row in got] == [5, 5, 2, 2, 1, 0], "scores should add up WEIGHTS and be sorted highest first"
assert got == expected, "verdicts at the boundaries 5, 2 and 1, ties ordered by file name, names without the folder"
assert triage([]) == [], "no reports give an empty list"
