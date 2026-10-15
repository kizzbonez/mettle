# Context-specific words: the club's name and the user name, after folding; and the order of codes.
empty = set()
assert check_password("my MILLBROOK season ticket", "zoe", False, empty) == ["CONTEXT"], "the club's name is found in any case"
assert check_password("go-ro-vers-go-ro-vers", "zoe", False, empty) == ["CONTEXT"], "the club's name is found after folding"
assert check_password("D.Brennan wins the cup 26", "d.brennan", False, empty) == ["CONTEXT"], "the user name is folded too"
assert check_password("seasonticket-dbrennan", "D.Brennan", False, empty) == ["CONTEXT"], "a user name in another case still matches"
assert check_password("metal ballads all night", "al", False, empty) == [], "user names shorter than 4 folded characters are not checked"
assert check_password("abel-and-the-blue-kite", "a.be", False, empty) == [], "a user name of 3 folded characters is not checked"
assert check_password("abel-and-the-blue-kite", "abel", False, empty) == ["CONTEXT"], "a user name of 4 folded characters is checked"

blocklist = {"millbrook4ever"}
assert check_password("Millbrook4ever", "fan", False, blocklist) == ["TOO-SHORT", "BLOCKLISTED", "CONTEXT"], (
    "every problem is listed, in the order of the instructions"
)
assert check_password("rovers" * 11, "fan", False, empty) == ["TOO-LONG", "CONTEXT"], "a long password can still have a context problem"
