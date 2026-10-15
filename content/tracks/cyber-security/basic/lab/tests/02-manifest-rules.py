# verify_manifest: comments, blank lines, binary markers, upper case digests, spaces in names,
# weak digests, tampered and missing files, and paths relative to the manifest's folder.
import hashlib
import os
import tempfile

with tempfile.TemporaryDirectory() as folder:
    release = os.path.join(folder, "release-3.3.0")
    os.mkdir(release)
    contents = {
        "notes.txt": b"call-out 3.3.0\n",
        "team roster.csv": b"name,role\namorgan,leader\n",
        "gateway.bin": bytes(range(256)),
        "old-hash.txt": b"kept for reference\n",
        "legacy.cfg": b"mode=legacy\n",
        "tampered.sh": b"echo original\n",
    }
    for name, data in contents.items():
        with open(os.path.join(release, name), "wb") as f:
            f.write(data)

    def sha256(name):
        return hashlib.sha256(contents[name]).hexdigest()

    lines = [
        "# release 3.3.0",
        "",
        f"{sha256('notes.txt')}  notes.txt",
        f"{sha256('team roster.csv')}  team roster.csv",
        f"{sha256('gateway.bin').upper()} *gateway.bin",
        f"{hashlib.md5(contents['old-hash.txt']).hexdigest()}  old-hash.txt",
        f"{hashlib.sha1(contents['legacy.cfg']).hexdigest()}  legacy.cfg",
        f"{sha256('tampered.sh')}  tampered.sh",
        f"{hashlib.sha256(b'x').hexdigest()}  not-shipped.txt",
        f"{hashlib.md5(b'x').hexdigest()}  also-not-shipped.txt",
        "   ",
    ]
    manifest = os.path.join(release, "SUMS")
    with open(manifest, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines) + "\n")
    with open(os.path.join(release, "tampered.sh"), "ab") as f:
        f.write(b"rm -rf /srv/callout\n")

    # Run from another folder, so names must be resolved next to the manifest.
    os.chdir(folder)
    got = verify_manifest(manifest)

assert isinstance(got, dict), "verify_manifest returns a dict"
assert "" not in got and len(got) == 8, "comment lines and blank (or space-only) lines are skipped, every other line is one entry"
assert list(got)[:2] == ["notes.txt", "team roster.csv"], "entries keep manifest order and the file name is everything after the mode character"
assert got.get("notes.txt") == "OK", "a matching SHA-256 digest, with paths relative to the manifest's own folder, is OK"
assert got.get("team roster.csv") == "OK", "a file name may contain spaces"
assert got.get("gateway.bin") == "OK", "a '*' mode character and an upper case digest still verify"
assert got.get("old-hash.txt") == "WEAK-DIGEST", "a 32-character digest is reported as weak even when it matches"
assert got.get("legacy.cfg") == "WEAK-DIGEST", "a 40-character digest is reported as weak even when it matches"
assert got.get("tampered.sh") == "MISMATCH", "a file whose SHA-256 digest differs is reported"
assert got.get("not-shipped.txt") == "MISSING", "a listed file that does not exist is reported"
assert got.get("also-not-shipped.txt") == "WEAK-DIGEST", "a weak digest is reported before checking whether the file exists"
