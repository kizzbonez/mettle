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
    # YOUR CODE: lower case, and every run of whitespace becomes one space.
    raise NotImplementedError


def review(path):
    """Return (time, session, finding, detail) for each problem in the log, in log order."""
    # YOUR CODE: read the JSON lines one by one with json.loads, remember who signed in to
    # each session, and apply the four rules from the instructions.
    raise NotImplementedError
