Write two functions in `solution.py` that apply the NIST SP 800-63B-4 rules from the lesson. The
starter gives you `fold(text)`, which lower-cases text and keeps only letters and digits
(`fold("P@ssw0rd!")` is `"pssw0rd"`), and `SERVICE_WORDS`, the club's own name.

1. **`load_blocklist(path)`** returns the **set** of folded passwords in a blocklist file. Remove
   the spaces around each line; skip blank lines and lines starting with `#`; fold every other
   line.
2. **`check_password(password, username, uses_mfa, blocklist)`** returns the list of problems, in
   this order, or `[]` when the password is accepted:
   - First normalize: `password = unicodedata.normalize("NFC", password)`. Length is then
     `len(password)`, which counts Unicode code points (an accented letter is one character).
   - `TOO-SHORT`: under 15 characters, or under 8 when `uses_mfa` is `True` (the password is not
     the only factor).
   - `TOO-LONG`: over 64 characters.
   - `BLOCKLISTED`: the folded password **equals** an entry of `blocklist`. Only the whole
     password is compared, never parts of it.
   - `CONTEXT`: the folded password **contains** a word of `SERVICE_WORDS`, or the folded user
     name when that has at least 4 characters.

   There are **no composition rules**: never require upper case, digits or symbols. NIST forbids
   them.

**Example.** `python solution.py` checks six requests against `data/blocklist.txt` and prints:

```text
'P@ssw0rd!'                     mfa=False ['TOO-SHORT', 'BLOCKLISTED']
'P@ssw0rd!'                     mfa=True  ['BLOCKLISTED']
'Correct Horse Battery Staple'  mfa=False ['BLOCKLISTED']
'dbrennan-matchday-2026'        mfa=False ['CONTEXT']
'Rovers till I die 1987'        mfa=False ['CONTEXT']
'lantern walrus quietly 47'     mfa=False accepted
```

The "complex" `P@ssw0rd!` is both short and on the breach list, and the famous four-word example
has been in breach lists for years; four words of your own pass.
