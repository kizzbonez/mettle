# The example from the instructions.
key = load_key("data/notes.key")
token = seal(key, "C-2001", "Ready to start in January.", bytes(12))
assert token == (
    "000000000000000000000000:"
    "83e31efbc829649346df0d59f1bfbcaa13f42b29fa6ecb97f40de599d11fda1d21b0d4310fbc066ac9b3"
), f"seal(key, 'C-2001', 'Ready to start in January.', bytes(12)) with the key in data/notes.key: got {token!r}"
assert open_note(key, "C-2001", token) == "Ready to start in January.", "open_note should return the note that seal sealed"
assert open_note(key, "C-1041", token) is None, "open_note should refuse a note sealed for another record"

bad = tampered("data/notes.csv", key)
assert bad == ["C-1043", "C-1044", "C-1046"], f"records in data/notes.csv whose notes cannot be opened: got {bad!r}"
assert open_note(key, "C-1045", "f0e1d2c3b4a5968778695a4b:37496e12ab831d89e6db2bb54ed876c146878765917a7eddd084e1201ae4b7afd77ea88aa0c641679c803e78b503e908f4d59932c67843b507d9905793432e6de3ec17e649c9da775ae1") == (
    "Relocating from São Paulo; speaks Portuguese and Spanish."
), "open_note should decode the note as UTF-8"
