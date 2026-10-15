# The blocklist: comments, blank lines and folding; whole-password matches only; no composition rules.
with open("t3-blocklist.txt", "w", encoding="utf-8") as f:
    f.write("# weekly breach feed\n\n   \nI Love You\n  # indented comment\nMonkey-Monkey-Monkey\n  sunshine sunshine  \n")
blocklist = load_blocklist("t3-blocklist.txt")
assert blocklist == {"iloveyou", "monkeymonkeymonkey", "sunshinesunshine"}, (
    "load_blocklist should skip blank lines and comments (also indented) and fold every other line"
)

assert check_password("i.love.you!", "fan", True, blocklist) == ["BLOCKLISTED"], "a password is compared with the blocklist after folding"
assert check_password("MONKEY monkey MONKEY", "fan", False, blocklist) == ["BLOCKLISTED"], "folding removes case and spaces"
assert check_password("Sunshine Sunshine", "fan", False, blocklist) == ["BLOCKLISTED"], "entries with spaces around them still match"
assert check_password("i love you more than football", "fan", False, blocklist) == [], (
    "only the whole password is compared with the blocklist, never parts of it"
)
assert check_password("all lower case words here", "fan", False, set()) == [], "no composition rules: lower-case letters alone are fine"
assert check_password("999999999999999", "fan", False, set()) == [], "no composition rules: digits alone are fine if not blocklisted"
