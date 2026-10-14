def verdict(code):
    ran = run_script(stdin=f"1\n{code}\n")
    assert ran.code == 0, "the script runs to the end without an error"
    lines = ran.out.split("\n")
    assert len(lines) == 3, "one code gives one line for the code and the count line"
    return lines[0]


assert verdict("901") == "901: wrong length", "a code of three characters is too short"
assert verdict("9017") == "9017: ok", "a code of four digits is long enough"
assert verdict("901736") == "901736: ok", "a code of six digits is not too long"
assert verdict("9017362") == "9017362: wrong length", "a code of seven characters is too long"
assert verdict("1234567") == "1234567: wrong length", "the length is checked before any other rule"
assert verdict("ab") == "ab: wrong length", "a short code with letters breaks the length rule first"
assert verdict("12 34") == "12 34: digits only", "a space inside a code is not a digit"
assert verdict("-1234") == "-1234: digits only", "a minus sign is not a digit"
assert verdict("１２３４") == "１２３４: digits only", "only the characters 0 to 9 count as digits, not other digit characters"
