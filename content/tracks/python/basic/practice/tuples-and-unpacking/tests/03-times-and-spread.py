def results(names, times):
    ran = run_script(stdin=f"{names}\n{times}\n")
    assert ran.code == 0, "the script runs to the end without an error"
    return ran.out.split("\n")


lines = results("A B C D", "59 60 605 3725")
assert lines[0] == "1. A 0:59", "a time under a minute shows 0 minutes"
assert lines[1] == "2. B 1:00", "a time of exactly one minute shows 00 seconds"
assert lines[2] == "3. C 10:05", "seconds under ten are written with two digits"
assert lines[3] == "4. D 62:05", "a time of an hour or more is still written in minutes"
assert lines[4] == "spread: 61:06", "the spread is the slowest time minus the fastest, written the same way"

lines = results("Ada", "125")
assert lines == ["1. Ada 2:05", "spread: 0:00", ""], "a single runner is first, with a spread of no time at all"

lines = results("Pat Sam", "1000 1000")
assert lines[2] == "spread: 0:00", "two runners with the same time have no spread"
