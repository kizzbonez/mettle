The tests run your file as a script and type in the codes: first a line with how many codes
follow, then one code per line. The starter already reads that number, loops over the codes,
strips the spaces around each one, and prints its line. Write only where a comment says
`YOUR CODE`.

For each code, check these rules **in this order**, and set `reason` to the message of the
**first** rule it breaks. A code that breaks none keeps `reason = "ok"`.

1. It is 4 to 6 characters long. Otherwise: `wrong length`.
2. Every character is one of the digits `0123456789`. Otherwise: `digits only`.
3. It is not too easy to guess: its digits are not all the same, as in `7777`, and they do not
   run upwards with each digit exactly one more than the one before, as in `3456` or `012345`.
   Otherwise: `too easy`. The digits do not wrap round: `9012` is fine, and so is `4321`.
4. Count each code as accepted (`ok`) or rejected, so that the last line,
   `ok: <accepted>, rejected: <rejected>`, adds up all the codes.

Example: with this input

```text
6
2580
123
12a4
3456
 7777 
914702
```

the script prints:

```text
2580: ok
123: wrong length
12a4: digits only
3456: too easy
7777: too easy
914702: ok
ok: 2, rejected: 4
```

With `0` codes it prints only `ok: 0, rejected: 0`.

**Tips.** Loop over the characters of the code to test each one with `in`, and `break` at the
first bad one. For the run upwards, loop over `range(1, len(code))` and compare `int(code[i])`
with `int(code[i - 1]) + 1`; `break` as soon as a pair does not fit, and let the loop's `else`
clause say "every pair fitted". Only check rule 3 once rules 1 and 2 have passed, so that
`int()` is only given digits.
