turns = Rota(["Dee", "Eli"], 3)
assert isinstance(turns, Rota), "Rota is a class whose instances are the iterators"
assert iter(turns) is turns, "__iter__ returns the object itself"
assert next(turns) == "Dee" and next(turns) == "Eli" and next(turns) == "Dee", "next gives the names in order, cycling"
for attempt in range(2):
    try:
        next(turns)
    except StopIteration:
        pass
    else:
        raise AssertionError("next raises StopIteration once every turn is given out, and keeps raising it")

used = Rota(["Fay", "Gus", "Hal"], 4)
assert list(used) == ["Fay", "Gus", "Hal", "Fay"], "the names start again after the last one"
assert list(used) == [], "a used-up Rota stays used up"
assert list(Rota(["Ivo"], 3)) == ["Ivo", "Ivo", "Ivo"], "a single name takes every turn"
assert list(Rota(["Jo", "Kit"], 0)) == [], "no turns give nothing"
assert list(Rota([], 4)) == [], "with no names, Rota produces nothing"
assert list(Rota(["Lu", "Max"], 2)) == ["Lu", "Max"], "turns equal to the number of names gives each name once"
assert "Ned" in Rota(["Mo", "Ned"], 2), "in works on a Rota through the iterator protocol"
assert sum(1 for _ in Rota(["a", "b", "c"], 100)) == 100, "a Rota gives exactly turns names"
