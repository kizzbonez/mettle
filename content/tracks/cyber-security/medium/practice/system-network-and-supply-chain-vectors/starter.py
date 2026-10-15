"""Audit the browser extensions on managed laptops against the allow list and an advisory."""
import csv
import json


def new_permissions(installed, approved):
    """Return the sorted permissions and host permissions INSTALLED asks for beyond APPROVED."""
    # YOUR CODE: both dicts may lack "permissions" or "host_permissions".
    raise NotImplementedError


def audit(inventory_path, allowlist_path, advisory_path):
    """Return (device, id, finding, detail) for every extension that needs action."""
    # YOUR CODE:
    # 1. json.load the inventory (a list) and the allow list (a dict keyed by extension ID).
    # 2. Read the (extension_id, version) pairs of the advisory with csv.DictReader.
    # 3. For each installed extension, the first finding that applies:
    #    compromised, unapproved, new-permissions.
    raise NotImplementedError
