# Length: 15 alone, 8 with MFA, at most 64, counted in code points after NFC normalization.
empty = set()
assert check_password("abcdefghijklmno", "user", False, empty) == [], "exactly 15 characters is long enough without MFA"
assert check_password("abcdefghijklmn", "user", False, empty) == ["TOO-SHORT"], "14 characters is too short without MFA"
assert check_password("abcdefgh", "user", True, empty) == [], "exactly 8 characters is long enough with MFA"
assert check_password("abcdefg", "user", True, empty) == ["TOO-SHORT"], "7 characters is too short even with MFA"
assert check_password("a" * 64, "user", False, empty) == [], "exactly 64 characters is allowed"
assert check_password("a" * 65, "user", False, empty) == ["TOO-LONG"], "65 characters is too long"
assert check_password("tea  for  two  ", "user", False, empty) == [], "spaces count as characters"
assert check_password("", "user", True, empty) == ["TOO-SHORT"], "an empty password is too short"

decomposed = "é" * 14          # 14 letters e with a separate accent: 28 code points before NFC
assert check_password(decomposed, "user", False, empty) == ["TOO-SHORT"], (
    "length is counted after NFC normalization, where e plus a combining accent is one character"
)
assert check_password("é" * 15, "user", False, empty) == [], "15 accented letters are long enough"
assert check_password("\U0001f511\U0001f3df" * 4, "user", True, empty) == [], "each emoji counts as one character"
