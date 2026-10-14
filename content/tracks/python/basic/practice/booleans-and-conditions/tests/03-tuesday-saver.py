def ticket(age, day):
    ran = run_script(stdin=f"{age}\n{day}\n")
    assert ran.code == 0, "the script runs to the end without an error"
    return ran.out


assert ticket(30, "tuesday") == "adult ticket: 5\nTuesday saver\n", "an adult ticket on a Tuesday typed in lower case"
assert ticket(30, "  TUESDAY  ") == "adult ticket: 5\nTuesday saver\n", (
    "the day is recognised whatever its capitals and the spaces around it"
)
assert ticket(80, "Tuesday") == "senior ticket: 5\nTuesday saver\n", "a senior ticket on a Tuesday"
assert ticket(1, "Tuesday") == "infant ticket: free\n", "a free ticket stays free on a Tuesday, with no saver line"
assert ticket(30, "tues") == "adult ticket: 10\n", "only the whole word counts as Tuesday"
assert ticket(30, "Thursday") == "adult ticket: 10\n", "on other days the normal price applies, with no saver line"
