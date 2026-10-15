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
    sender = msg["From"].addresses[0]     # .display_name, .domain
    # YOUR CODE: the five rules from the instructions.
    raise NotImplementedError


def triage(paths):
    """Return [(file name, score, verdict), ...], highest score first, then by name."""
    # YOUR CODE: read each file as UTF-8, add up WEIGHTS, then the verdict.
    raise NotImplementedError
