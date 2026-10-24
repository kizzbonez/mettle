This first lab is about the lab itself: how you run your code, how the tests report on it, and
how you hand it in. The program in `solution.go` is finished and the compiler accepts it, but one
value in it is out of date.

1. Press **Run** without changing anything. Go compiles the program and the first test runs it,
   as `go run .` would. The test compares what the program printed with the winter board below,
   one line at a time, and fails at the first line that differs. Its message names that line and
   shows what the test expected and what your program actually printed: compare the two.
2. Find the line under the comment that says `CHANGE`. From this winter, skate hire costs 4 euros,
   so change the `3` on that line to `4`. Change nothing else: the program works out the hours on
   the ice by itself, from `18-10`.
3. Press **Run** again. The test now passes.
4. Press **Submit**. Submit runs the visible test again and three hidden tests, which check each
   line of the board and that the program ran without an error. For a hidden test you only see
   its name and what it checked.

The winter board your program should print:

```text
Welcome to Northgate Ice Rink
Public skating every day from 10 to 18
Skate hire: 4 euros
Hours on the ice each day: 8
Gloves are required on the ice
```

The compiler could not find this mistake for you: `3` is a perfectly good number, just not the
right one. Catching mistakes like that is what tests are for.
