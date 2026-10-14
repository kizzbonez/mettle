def verdict(code):
    ran = run_script(stdin=f"1\n{code}\n")
    assert ran.code == 0, "the script runs to the end without an error"
    lines = ran.out.split("\n")
    assert len(lines) == 3, "one code gives one line for the code and the count line"
    return lines[0]


assert verdict("0123") == "0123: too easy", "a run upwards that starts at 0"
assert verdict("456789") == "456789: too easy", "a run upwards of six digits"
assert verdict("000000") == "000000: too easy", "six times the same digit"
assert verdict("5555") == "5555: too easy", "four times the same digit"
assert verdict("1235") == "1235: ok", "a run upwards that breaks at its last digit is fine"
assert verdict("2345") == "2345: too easy", "a run upwards that does not start at 0 or 1"
assert verdict("2435") == "2435: ok", "every digit must be one more than the one before, not only the last more than the first"
assert verdict("9012") == "9012: ok","the digits do not wrap round from 9 to 0"
assert verdict("4321") == "4321: ok", "a run downwards is fine"
assert verdict("11112") == "11112: ok", "the same digit almost everywhere is fine"
assert verdict("1122") == "1122: ok", "repeated pairs are fine"
assert verdict("13579") == "13579: ok", "digits that go up by two are fine"
