"""Audit the browser extensions on managed laptops against the allow list and an advisory."""
import csv
import json


def new_permissions(installed, approved):
    """Return the sorted permissions and host permissions INSTALLED asks for beyond APPROVED."""
    wanted = set(installed.get("permissions", [])) | set(installed.get("host_permissions", []))
    allowed = set(approved.get("permissions", [])) | set(approved.get("host_permissions", []))
    return sorted(wanted - allowed)


def audit(inventory_path, allowlist_path, advisory_path):
    """Return (device, id, finding, detail) for every extension that needs action."""
    with open(inventory_path) as f:
        inventory = json.load(f)
    with open(allowlist_path) as f:
        allowlist = {key.lower(): value for key, value in json.load(f).items()}
    with open(advisory_path, newline="") as f:
        bad = {(row["extension_id"].strip().lower(), row["version"].strip()) for row in csv.DictReader(f)}

    findings = []
    for ext in inventory:
        ext_id = ext["id"].lower()
        version = ext["version"].strip()
        if (ext_id, version) in bad:
            findings.append((ext["device"], ext_id, "compromised", version))
        elif ext_id not in allowlist:
            findings.append((ext["device"], ext_id, "unapproved", ext["name"]))
        else:
            extra = new_permissions(ext, allowlist[ext_id])
            if extra:
                findings.append((ext["device"], ext_id, "new-permissions", ",".join(extra)))
    return sorted(findings)
