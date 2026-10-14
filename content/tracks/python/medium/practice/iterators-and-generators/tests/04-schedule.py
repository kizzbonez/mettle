from itertools import count, islice

taken = []


def chores_from_the_board():
    for chore in ["bins", "dishes", "hoover", "bathroom", "fridge"]:
        taken.append(chore)
        yield chore


plan = schedule(chores_from_the_board(), ["Ana", "Ben"])
assert taken == [], "schedule takes no chore before the first line is asked for"
assert next(plan) == "bins: Ana", "the first chore goes to the first name"
assert len(taken) <= 2, "schedule takes chores one at a time, as lines are asked for"
assert next(plan) == "dishes: Ben", "the second chore goes to the second name"
assert len(taken) <= 3, "schedule still has not taken all the chores"
assert list(plan) == ["hoover: Ana", "bathroom: Ben", "fridge: Ana"], "the rota starts again after the last name"

endless = schedule((f"job {n}" for n in count(1)), ["Cy", "Dee", "Eli"])
assert list(islice(endless, 4)) == ["job 1: Cy", "job 2: Dee", "job 3: Eli", "job 4: Cy"], "schedule works with an endless supply of chores"

assert list(schedule([], ["Ana"])) == [], "no chores give no lines"
assert list(schedule(("cooking",), ["Fay"])) == ["cooking: Fay"], "chores can be any iterable"
assert list(schedule(["bins", "dishes"], [])) == [], "with nobody on the rota there are no lines"
