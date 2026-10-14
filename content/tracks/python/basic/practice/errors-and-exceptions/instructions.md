`solution.py` has two parts: the function `calculate` at the top, which the tests call directly,
and below it the **script part**, which the tests run with lines typed into it. `calculate` must
not print or catch anything; the script part decides what to do with its exceptions.

1. `calculate(line)` takes a line such as `"12 / 4"` and returns the result as a `float`. Split
   the line on spaces, then check it in this order:
   - if it does not have exactly three parts, raise `ValueError` with the message
     `expected a number, an operator and a number`;
   - if the middle part is not one of `+`, `-`, `*`, `/`, raise `ValueError` with the message
     `unknown operator <part>`, such as `unknown operator ^`;
   - convert the two numbers with `float()`. Do not catch its `ValueError`: let it travel up to
     the caller, message and all;
   - work out the result. Do not check for a division by zero either: let Python raise its
     `ZeroDivisionError`.
2. The **script part** reads lines with `input()`, without a prompt, **until the input ends**,
   which `input()` reports by raising `EOFError`. It removes the spaces around each line and
   skips a line that is then empty. For every other line it calls `calculate` and prints:
   - on success: `<line> = <result>`, the result with two decimals;
   - on a `ZeroDivisionError`: `<line> -> cannot divide by zero`;
   - on a `ValueError`: `<line> -> <the error's message>`.

   At the end it prints `<n> worked, <m> failed`, counting the lines that worked and those that
   failed. Skipped blank lines count as neither.

Example: `calculate("12 / 4")` returns `3.0`. With these lines typed in (one of them blank)

```text
12 / 4
2.5 * 4
12 / 0
2 ^ 3

ten * 2
7
10 - 12.25
```

the script prints:

```text
12 / 4 = 3.00
2.5 * 4 = 10.00
12 / 0 -> cannot divide by zero
2 ^ 3 -> unknown operator ^
ten * 2 -> could not convert string to float: 'ten'
7 -> expected a number, an operator and a number
10 - 12.25 = -2.25
3 worked, 4 failed
```

With no input at all it prints only `0 worked, 0 failed`.

**Tips.** Test the operator against a tuple, `("+", "-", "*", "/")`, not the string `"+-*/"`,
which would also accept `*/`. The lesson's complete program shows the reading loop:
`try: line = input()` with `except EOFError: break`. Put the code that depends on success in
the `else` branch, and catch `ZeroDivisionError` and `ValueError` in branches of their own;
`except ValueError as error` gives you the message with `str(error)` or in an f-string. To try
the script yourself, run it, type some lines, then press Ctrl+D (Ctrl+Z then Enter on Windows).
