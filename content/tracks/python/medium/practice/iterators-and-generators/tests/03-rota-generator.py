import inspect
from itertools import islice

assert inspect.isgeneratorfunction(rota), "rota is a generator function"
cycle = rota(["Ana", "Ben", "Cy"])
assert [next(cycle) for _ in range(7)] == ["Ana", "Ben", "Cy", "Ana", "Ben", "Cy", "Ana"], "rota cycles through the names"
long_run = list(islice(rota(["x", "y"]), 1001))
assert len(long_run) == 1001 and long_run[-1] == "x" and long_run.count("y") == 500, "rota keeps cycling for as long as it is asked"
one, two = rota(["p", "q"]), rota(["p", "q"])
next(one)
assert next(two) == "p", "every call of rota starts its own cycle"

assert first_turns(["Dee", "Eli"], 5) == ["Dee", "Eli", "Dee", "Eli", "Dee"], "first_turns takes the first n names of the cycle"
assert first_turns(["Dee"], 0) == [], "first_turns with n of 0 is empty"
assert isinstance(first_turns(["Dee"], 2), list), "first_turns returns a list"
assert first_turns([], 4) == [], "first_turns with no names is empty"
assert list(rota([])) == [], "rota with no names yields nothing and ends"
