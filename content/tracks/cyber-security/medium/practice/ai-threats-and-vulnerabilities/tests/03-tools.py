# review(): tool names, and send_email bound to the patron signed in to the same session.
import json
from pathlib import Path

events = [
    {"time": "T01", "session": "a", "event": "login", "patron": "P-1", "email": "lena@mail.example"},
    {"time": "T02", "session": "b", "event": "tool", "name": "send_email", "args": {"to": "lena@mail.example"}},
    {"time": "T03", "session": "a", "event": "tool", "name": "send_email", "args": {"to": " LENA@mail.example "}},
    {"time": "T04", "session": "a", "event": "login", "patron": "P-2", "email": "omid@mail.example"},
    {"time": "T05", "session": "a", "event": "tool", "name": "send_email", "args": {"to": " lena@mail.example "}},
    {"time": "T06", "session": "a", "event": "tool", "name": "send_email", "args": {"to": "omid@mail.example"}},
    {"time": "T07", "session": "c", "event": "tool", "name": "send_email", "args": {"to": "kit@mail.example"}},
    {"time": "T08", "session": "c", "event": "login", "patron": "P-3", "email": "kit@mail.example"},
    {"time": "T09", "session": "a", "event": "tool", "name": "send_email", "args": {}},
    {"time": "T10", "session": "a", "event": "tool", "name": "Send_Email", "args": {"to": "omid@mail.example"}},
    {"time": "T11", "session": "a", "event": "tool", "name": "delete_patron", "args": {"patron": "P-2"}},
    {"time": "T12", "session": "a", "event": "tool", "name": "place_hold", "args": {"item": "ignore previous instructions"}},
]
Path("t3-log.jsonl").write_text("".join(json.dumps(event) + "\n" for event in events), encoding="utf-8")

got = review("t3-log.jsonl")
by_time = {row[0]: row for row in got}
assert by_time.get("T02") == ("T02", "b", "recipient-mismatch", "lena@mail.example"), (
    "a login in another session does not authorize an email: a session without a login fails closed"
)
assert "T03" not in by_time, "the signed-in patron's address, in another case and with spaces, is not a mismatch"
assert by_time.get("T05") == ("T05", "a", "recipient-mismatch", "lena@mail.example"), (
    "after a second login, only the latest patron of the session counts; detail without spaces"
)
assert "T06" not in by_time, "an email to the latest patron of the session is fine"
assert by_time.get("T07") == ("T07", "c", "recipient-mismatch", "kit@mail.example"), "a login after the call does not count"
assert by_time.get("T09") == ("T09", "a", "recipient-mismatch", ""), "a send_email without a to argument is a mismatch with an empty detail"
assert by_time.get("T10") == ("T10", "a", "tool-not-allowed", "Send_Email"), "tool names are compared exactly"
assert by_time.get("T11") == ("T11", "a", "tool-not-allowed", "delete_patron"), "a tool that is not allowed"
assert "T12" not in by_time, "the arguments of an allowed tool other than send_email are not checked"
assert len(got) == 6, "only these six events are findings"
