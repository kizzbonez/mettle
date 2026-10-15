# audit(): several devices and extensions, sorting, details, and an empty report.
import json
from pathlib import Path

GOOD = "mmmmmmmmnnnnnnnnoooooooopppppppp"
SHADY = "bbbbbbbbaaaaaaaaccccccccdddddddd"
NEW = "eeeeeeeeffffffffgggggggghhhhhhhh"
inventory = []
for device in ["uw-12", "fin-02", "uw-03"]:
    inventory.append({"device": device, "user": "x", "id": GOOD, "name": "Tab Saver", "version": "7.1",
                      "permissions": ["storage", "tabs"], "host_permissions": ["https://*.ashdown.example/*"]})
inventory.append({"device": "uw-03", "user": "x", "id": SHADY, "name": "Free VPN Turbo", "version": "0.9",
                  "permissions": ["proxy", "<all_urls>"]})
inventory.append({"device": "fin-02", "user": "y", "id": NEW, "name": "Spreadsheet Linker", "version": "3.0",
                  "permissions": ["storage", "scripting"], "host_permissions": ["https://*/*", "http://*/*"]})
Path("t4-inventory.json").write_text(json.dumps(inventory))
Path("t4-allow.json").write_text(json.dumps({
    GOOD: {"name": "Tab Saver", "reviewed": "2026-05-01", "permissions": ["storage", "tabs"],
           "host_permissions": ["https://*.ashdown.example/*"]},
    NEW: {"name": "Spreadsheet Linker", "reviewed": "2026-06-11", "permissions": ["storage"]},
}))
Path("t4-advisory.csv").write_text("extension_id,version,note\n")

assert audit("t4-inventory.json", "t4-allow.json", "t4-advisory.csv") == [
    ("fin-02", NEW, "new-permissions", "http://*/*,https://*/*,scripting"),
    ("uw-03", SHADY, "unapproved", "Free VPN Turbo"),
], "findings sorted by device, with the name for unapproved extensions and sorted extras joined by commas"

Path("t4-empty.json").write_text("[]")
assert audit("t4-empty.json", "t4-allow.json", "t4-advisory.csv") == [], "an empty inventory has no findings"
