This first lab is about the lab itself: how you run your code, how the tests report on it, and
how you hand it in. The program in `solution.ts` is finished and the compiler accepts it, but one
value in it is out of date.

1. Press **Run** without changing anything. The compiler checks the program and finds no type
   errors, then the program runs. The first test compares what it printed with the summer sign
   below, and fails. Its message shows what the test expected and what your program printed:
   compare them line by line.
2. Find the line under the comment that says `CHANGE`. This summer the pool closes at 20 instead
   of 18, so change `18` to `20`. Change nothing else: the program works out the third line, the
   hours open each day, from the two times.
3. Press **Run** again. The test now passes.
4. Press **Submit**. Submit runs the visible test again and three hidden tests, which check each
   line of the sign and that the program ran without an error.

The summer sign your program should print:

```text
Welcome to Riverside Pool
Open every day from 7 to 20
Hours open each day: 13
Please shower before you swim
```

The compiler could not find this mistake for you: `18` is a perfectly good number, just not the
right one. Lesson 1 calls this a well-typed mistake, and catching those is what tests are for.
