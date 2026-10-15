"""Score the messages staff report as phishing, from their headers."""
import re
from email import message_from_string, policy
from pathlib import Path

OUR_DOMAIN = "brightwell-build.example"
GATEWAY = "mx1.brightwell-build.example"
EXECUTIVES = ["Omar Haddad", "Ruth Calloway", "Sam Mensah"]
URGENT_WORDS = ["urgent", "immediately", "today", "overdue", "final notice", "asap"]
FAILURES = {("spf", "fail"), ("spf", "softfail"), ("dkim", "fail"), ("dkim", "none"), ("dmarc", "fail")}
WEIGHTS = {"lookalike": 3, "auth-fail": 2, "reply-to": 2, "display-name": 2, "urgency": 1}


def one_edit_apart(a, b):
    """True when A and B differ by exactly one inserted, deleted or changed character."""
    if a == b or abs(len(a) - len(b)) > 1:
        return False
    if len(a) > len(b):
        a, b = b, a
    i = 0
    while i < len(a) and a[i] == b[i]:
        i += 1
    if len(a) == len(b):
        return a[i + 1:] == b[i + 1:]
    return a[i:] == b[i + 1:]


def red_flags(raw):
    """Return the sorted list of red flags in the message RAW (its full text)."""
    msg = message_from_string(raw, policy=policy.default)
    sender = msg["From"].addresses[0]
    domain = sender.domain.lower()
    ours = domain == OUR_DOMAIN
    flags = set()

    ascii_domain = domain.encode("idna").decode("ascii")
    if not ours and (any(label.startswith("xn--") for label in ascii_domain.split("."))
                     or one_edit_apart(domain, OUR_DOMAIN)):
        flags.add("lookalike")

    if msg["Reply-To"] is not None:
        reply_domain = msg["Reply-To"].addresses[0].domain.lower()
        if reply_domain != domain:
            flags.add("reply-to")

    for header in msg.get_all("Authentication-Results") or []:
        text = str(header).lower()
        if text.split(";")[0].strip() != GATEWAY:
            continue
        if FAILURES & set(re.findall(r"\b(spf|dkim|dmarc)=([a-z]+)", text)):
            flags.add("auth-fail")

    name = sender.display_name.lower()
    if not ours and any(person.lower() in name for person in EXECUTIVES):
        flags.add("display-name")

    subject = str(msg["Subject"] or "").lower()
    if any(word in subject for word in URGENT_WORDS):
        flags.add("urgency")
    return sorted(flags)


def triage(paths):
    """Return [(file name, score, verdict), ...], highest score first, then by name."""
    results = []
    for path in paths:
        flags = red_flags(Path(path).read_text(encoding="utf-8"))
        score = sum(WEIGHTS[flag] for flag in flags)
        verdict = "phishing" if score >= 5 else "suspicious" if score >= 2 else "benign"
        results.append((Path(path).name, score, verdict))
    return sorted(results, key=lambda item: (-item[1], item[0]))
