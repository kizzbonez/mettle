Write one iterator class and three functions in `solution.py`. In each of them, `names` is a
list of the housemates in rota order, which may be empty.

1. **`Rota(names, turns)`**, an iterator class with `__iter__` and `__next__`. It produces
   `turns` names in all: the names in order, starting again at the first after the last.
   `__iter__` returns the object itself, and once all its turns are given out, every further
   `next` raises StopIteration. With no names it produces nothing at all.
2. **`rota(names)`**, a generator function that yields the names in the same endless cycle,
   for ever. With no names it ends at once, without yielding anything.
3. **`first_turns(names, n)`** returns a list of the first `n` names of `rota(names)`, taken
   with `itertools.islice`.
4. **`schedule(chores, names)`**, a generator function. `chores` is any iterable of chore
   names, possibly endless. It yields `CHORE: NAME` for each chore in turn, with the next name
   from `rota(names)`, and ends when the chores run out. It must be lazy: it takes the next
   chore only when the next line is asked for, never all of them first.

Example:

```python
list(Rota(["Ana", "Ben", "Cy"], 5))   # ['Ana', 'Ben', 'Cy', 'Ana', 'Ben']
first_turns(["Ana", "Ben"], 3)        # ['Ana', 'Ben', 'Ana']
type(rota(["Ana"])).__name__          # 'generator'
plan = schedule(["bins", "dishes", "hoover"], ["Ana", "Ben"])
next(plan)                            # 'bins: Ana'
list(plan)                            # ['dishes: Ben', 'hoover: Ana']
```

**Tips.** `while True:` around `yield from names` repeats the names for ever, but with an empty
list that loop would spin without ever yielding: return first. `zip` stops at its shorter
input and asks each input for one item at a time, so it works with an endless generator.
