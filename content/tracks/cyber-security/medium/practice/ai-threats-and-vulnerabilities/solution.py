"""Review the library assistant's log for prompt injection and risky tool calls."""
import json

INJECTION_PHRASES = [
    "ignore previous instructions",
    "ignore your previous instructions",
    "ignore all previous instructions",
    "disregard the above",
    "do not mention this",
    "reveal your system prompt",
    "ai assistant:",
]
ALLOWED_TOOLS = {"search_catalogue", "renew_loan", "place_hold", "send_email"}


def injection_phrases(text):
    """Return the sorted INJECTION_PHRASES found in TEXT, ignoring case and spacing."""
    normal = " ".join(text.lower().split())
    return sorted(phrase for phrase in INJECTION_PHRASES if phrase in normal)


def review(path):
    """Return (time, session, finding, detail) for each problem in the log, in log order."""
    findings = []
    emails = {}                                  # session -> email of the patron signed in
    with open(path, encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            event = json.loads(line)
            when, session, kind = event["time"], event["session"], event["event"]
            if kind == "login":
                emails[session] = event["email"].strip().lower()
            elif kind == "retrieved":
                if injection_phrases(event["content"]):
                    findings.append((when, session, "indirect-injection", event["url"]))
            elif kind == "user":
                phrases = injection_phrases(event["text"])
                if phrases:
                    findings.append((when, session, "direct-injection", ", ".join(phrases)))
            elif kind == "tool":
                name = event["name"]
                if name not in ALLOWED_TOOLS:
                    findings.append((when, session, "tool-not-allowed", name))
                elif name == "send_email":
                    to = str(event.get("args", {}).get("to", "")).strip()
                    if to.lower() != emails.get(session):
                        findings.append((when, session, "recipient-mismatch", to))
    return findings
