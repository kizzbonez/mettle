# audit(): which finding wins, exact versions, IDs in any case.
import json
from pathlib import Path

A = "aaaabbbbccccddddeeeeffffgggghhhh"
B = "iiiijjjjkkkkllllmmmmnnnnoooopppp"
C = "abcdefghijklmnopabcdefghijklmnop"


def ext(device, ext_id, version, perms=("storage",), hosts=()):
    return {"device": device, "user": "u", "id": ext_id, "name": f"Extension {ext_id[:4]}", "version": version,
            "permissions": list(perms), "host_permissions": list(hosts)}


Path("t3-inventory.json").write_text(json.dumps([
    ext("pc-1", A, "2.0.1", perms=("storage", "cookies")),
    ext("pc-2", A, "2.0.10"),
    ext("pc-3", A.upper(), " 2.0.1 "),
    ext("pc-4", B, "5.5.0"),
    ext("pc-5", C, "1.0.0", perms=("storage", "tabs")),
    ext("pc-6", C.upper(), "1.0.0"),
]))
Path("t3-allow.json").write_text(json.dumps({
    A: {"name": "Extension aaaa", "reviewed": "2026-01-01", "permissions": ["storage"], "host_permissions": []},
    C.upper(): {"name": "Extension abcd", "reviewed": "2026-02-01", "permissions": ["storage"]},
}))
Path("t3-advisory.csv").write_text(
    "extension_id,version,note\n"
    f"{A.upper()},2.0.1,malicious build\n"
    f"{B}, 5.5.0 ,malicious build\n"
)

got = audit("t3-inventory.json", "t3-allow.json", "t3-advisory.csv")
by_device = {row[0]: row for row in got}
assert by_device.get("pc-1") == ("pc-1", A, "compromised", "2.0.1"), (
    "a compromised version is reported as compromised even when it also adds permissions"
)
assert "pc-2" not in by_device, "version 2.0.10 is not 2.0.1: versions are compared exactly"
assert by_device.get("pc-3") == ("pc-3", A, "compromised", "2.0.1"), (
    "IDs in upper case and versions with spaces should still match the advisory"
)
assert by_device.get("pc-4") == ("pc-4", B, "compromised", "5.5.0"), (
    "a compromised version of an unapproved extension is reported as compromised"
)
assert by_device.get("pc-5") == ("pc-5", C, "new-permissions", "tabs"), (
    "an allow list key in upper case should still approve the extension"
)
assert "pc-6" not in by_device, "an approved extension asking for nothing new is not a finding"
assert len(got) == 4, "only extensions that need action are returned"
