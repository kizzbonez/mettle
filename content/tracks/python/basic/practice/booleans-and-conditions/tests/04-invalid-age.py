def ticket(age, day):
    ran = run_script(stdin=f"{age}\n{day}\n")
    assert ran.code == 0, "the script runs to the end without an error, even for an age it rejects"
    return ran.out


assert ticket(-1, "monday") == "invalid age\n", "an age just below 0 is rejected, and nothing else is printed"
assert ticket(121, "monday") == "invalid age\n", "an age just above 120 is rejected, and nothing else is printed"
assert ticket(-40, "Tuesday") == "invalid age\n", "a rejected age prints no ticket and no saver line, even on a Tuesday"
assert ticket(999, "sunday") == "invalid age\n", "a much too large age is rejected"
