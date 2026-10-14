Write four short functions in `solution.py`. A team's results are a string of the letters
`W` (win, 3 points), `D` (draw, 1 point) and `L` (loss, 0 points), oldest first. Each function
needs only a line or two with the right tool from `itertools` or `functools`.

1. `running_points(results)` returns a list with the team's total after each match (use
   `accumulate`). An empty string gives `[]`.
2. `streaks(results)` returns a list of `(letter, length)` tuples, one for each run of equal
   results in a row, in order (use `groupby`). An empty string gives `[]`.
3. `fixtures(teams, both_legs=False)` returns a list of `(home, away)` tuples. With
   `both_legs=False`, every pair of teams meets once, in the order `combinations` gives. With
   `both_legs=True`, every pair meets twice, once at each home, in the order `permutations`
   gives. Fewer than two teams give `[]`.
4. `ways_to_score(points)` returns how many different sequences of wins and draws add up to
   exactly `points` (an order counts as different: `WD` and `DW` are two ways). There is one
   way to score 0 (play no match) and none to score a negative number. It is recursive:
   the last match was either a win or a draw. Decorate it with `functools.cache`, so that
   `ways_to_score(300)` returns at once; the tests call `ways_to_score.cache_info()`.

Example:

```python
running_points("WWDLW")        # [3, 6, 7, 7, 10]
streaks("WWDLLLW")             # [('W', 2), ('D', 1), ('L', 3), ('W', 1)]
fixtures(["Owls", "Foxes", "Hares"])
# [('Owls', 'Foxes'), ('Owls', 'Hares'), ('Foxes', 'Hares')]
fixtures(["Owls", "Foxes"], both_legs=True)
# [('Owls', 'Foxes'), ('Foxes', 'Owls')]
ways_to_score(4)               # 3: WD, DW and DDDD
```

**Tip:** a group from `groupby` is an iterator, so count it with `len(list(group))` before the
loop moves on.
