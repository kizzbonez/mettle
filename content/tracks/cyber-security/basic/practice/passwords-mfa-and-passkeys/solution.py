"""Check new member passwords against NIST SP 800-63B-4 before they are hashed and stored."""
import unicodedata

SERVICE_WORDS = ["millbrook", "rovers"]   # context-specific words: the club's own name


def fold(text):
    """Lower-case TEXT and keep only letters and digits: 'P@ssw0rd!' becomes 'pssw0rd'."""
    return "".join(ch for ch in text.lower() if ch.isalnum())


def load_blocklist(path):
    """Return the set of folded passwords in a blocklist file."""
    entries = set()
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            entries.add(fold(line))
    return entries


def check_password(password, username, uses_mfa, blocklist):
    """Return the list of problems with a new password, in the order of the instructions; [] accepts it."""
    password = unicodedata.normalize("NFC", password)
    problems = []
    minimum = 8 if uses_mfa else 15
    if len(password) < minimum:
        problems.append("TOO-SHORT")
    if len(password) > 64:
        problems.append("TOO-LONG")
    folded = fold(password)
    if folded in blocklist:
        problems.append("BLOCKLISTED")
    words = list(SERVICE_WORDS)
    user = fold(username)
    if len(user) >= 4:
        words.append(user)
    if any(word in folded for word in words):
        problems.append("CONTEXT")
    return problems


if __name__ == "__main__":
    blocklist = load_blocklist("data/blocklist.txt")
    for password, username, mfa in [
        ("P@ssw0rd!", "jsmith", False),
        ("P@ssw0rd!", "jsmith", True),
        ("Correct Horse Battery Staple", "aoki", False),
        ("dbrennan-matchday-2026", "dbrennan", False),
        ("Rovers till I die 1987", "kpatel", False),
        ("lantern walrus quietly 47", "lmensah", False),
    ]:
        print(f"{password!r:31} mfa={mfa!s:5} {check_password(password, username, mfa, blocklist) or 'accepted'}")
