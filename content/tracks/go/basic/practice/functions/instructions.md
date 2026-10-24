Write the bodies of the four functions in `solution.go`. Keep their first lines exactly as they
are: the tests call them with these names, parameters and results.

1. **`scoreArrow(call string) (points int, ok bool)`** returns the points of one call and
   `true`: `"X"` scores 10, `"10"` down to `"1"` score their number, and `"M"` (a miss) scores 0.
   Any other call, such as `"0"`, `"11"`, `"x"` or `""`, returns `0, false`. Calls are written
   exactly like this: a lower-case `x` or `m` is not valid. `strconv.Atoi` (add `"strconv"` to an
   `import` line) turns `"7"` into 7, but it also accepts `"0"` and `"-1"`, so check the range.
2. **`endTotal(calls ...string) (total, golds int, ok bool)`** is **variadic**: it takes the
   calls of one end, any number of them. It returns the total of their points, the number of
   **golds** (arrows that scored 9 or 10, so an `X` is a gold) and `true`. If any call is not
   valid, it returns `0, 0, false`. An end with no calls is valid and scores 0. Use `scoreArrow`.
3. **`countArrows(rule func(int) bool, points ...int) int`** returns how many of `points` the
   function `rule` says `true` for. Call `rule` once for every point.
4. **`newRoundTally(ends int) func(endScore int) (total int, done bool)`** returns a new
   function, the round's tally. Each call of the tally adds one end's score and returns the
   running total, with `done` true once `ends` ends have been added. After that the round is
   over: further calls add nothing and return the final total and `true`. Keep the running total
   in variables inside `newRoundTally`, so that every tally is a **closure** with its own total.

Example:

```go
scoreArrow("X")                      // 10, true
scoreArrow("7")                      // 7, true
scoreArrow("11")                     // 0, false
endTotal("X", "9", "7")              // 26, 2, true
endTotal("X", "Z", "9")              // 0, 0, false
countArrows(func(p int) bool { return p >= 9 }, 10, 9, 7, 9, 3) // 3

tally := newRoundTally(2)
tally(26) // 26, false
tally(18) // 44, true: two ends make the round
tally(30) // 44, true: the round is over
```
