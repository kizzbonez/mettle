def ticket(age, day="monday"):
    ran = run_script(stdin=f"{age}\n{day}\n")
    assert ran.code == 0, "the script runs to the end without an error"
    return ran.out


assert ticket(0) == "infant ticket: free\n", "a newborn, age 0, gets a free infant ticket"
assert ticket(2) == "infant ticket: free\n", "the oldest age that is still an infant"
assert ticket(3) == "child ticket: 6\n", "the youngest age that is a child"
assert ticket(15) == "child ticket: 6\n", "the oldest age that is still a child"
assert ticket(16) == "adult ticket: 10\n", "the youngest age that is an adult"
assert ticket(64) == "adult ticket: 10\n", "the oldest age that is still an adult"
assert ticket(65) == "senior ticket: 7\n", "the youngest age that is a senior"
assert ticket(120) == "senior ticket: 7\n", "the oldest age the cinema accepts"
