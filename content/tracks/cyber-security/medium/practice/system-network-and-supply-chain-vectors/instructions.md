Write two functions in `solution.py`. An extension is a dict like those in
`data/extensions.json`: `device`, `user`, `id`, `name`, `version`, `permissions` and
`host_permissions` (lists of strings).

1. `new_permissions(installed, approved)` returns the sorted list of the strings in
   `installed`'s `permissions` and `host_permissions` that are in neither list of `approved`
   (the entry the security team reviewed). A missing key counts as an empty list. An update that
   adds `cookies` or `*://*/*` to a reviewed extension shows up here.
2. `audit(inventory_path, allowlist_path, advisory_path)` reads three files:
   - the inventory: a JSON list of installed extensions, one per device;
   - the allow list: a JSON object from extension ID to the reviewed entry (`name`, `reviewed`,
     `permissions`, `host_permissions`);
   - the advisory: a CSV with the columns `extension_id,version,note`, one row per malicious
     version.

   For each installed extension, the **first** of these that applies is a finding:
   1. `("compromised", version)` when its ID and exact `version` are in the advisory, whether
      or not it is approved;
   2. `("unapproved", name)` when its ID is not in the allow list;
   3. `("new-permissions", extras)` when `new_permissions` against its reviewed entry is not
      empty; `extras` is that list joined with commas, no spaces.

   Return a list of tuples `(device, id, finding, detail)`, sorted by device, then ID.
   Extension IDs are compared ignoring case and returned in lower case; versions are compared
   exactly, after removing spaces around them.

**Example.** With the files in `data/`:

```python
audit("data/extensions.json", "data/allowlist.json", "data/advisory.csv")
# [('ash-lt-014', 'kdlmgifhpcbjnegpaeoijbfhbmplcnek', 'compromised', '3.8.1'),
#  ('ash-lt-021', 'hmjkmjkepdijhoojdojkdfohbdgmmhki', 'unapproved', 'PDF Quick Convert'),
#  ('ash-lt-033', 'oafchlnmbedjgbfkeipniaocgimhedfn', 'new-permissions', '*://*/*,cookies')]
```

SafeLink Inspector is approved, but version 3.8.1 is the malicious update; 3.8.2 on
`ash-lt-021` is the fixed one. The grammar helper was reviewed with access to the claims site
only, and its latest version asks to read cookies on every site.

**Tip.** Sets make the comparison short: `set(a) | set(b)` and `wanted - allowed`. Build a set
of `(id, version)` tuples from the advisory.
