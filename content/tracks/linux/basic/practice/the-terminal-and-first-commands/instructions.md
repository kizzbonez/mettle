The tests run your script with

```bash
bash solution.sh
```

Before each run they install two check programs that the script can call by name, like any other
command. Neither prints anything; each only finishes with an exit status:

- `oven-check` finishes with `0` when the oven is hot, and with another number while it is still
  heating up;
- `till-check` finishes with `0` when the till holds enough change, and with another number when
  it does not.

The starter already prints the first two lines and the last one. Write two lines where it says
`YOUR CODE`, in this order:

1. When `oven-check` **succeeds**, print `Oven: start the bread`. When it fails, print nothing
   for the oven.
2. When `till-check` **fails**, print `Till: fetch change from the bank`. When it succeeds, print
   nothing for the till.

Write each as one line that runs the check and then `echo`, joined with `&&` or `||`. Do not use
`;` there: with `;` the second command runs whatever happened.

When the oven is hot and the till holds enough change, which is the visible test, the script
prints:

```text
Opening checklist
oven status: 0
Oven: start the bread
Checklist done
```

The hidden tests try the other cases: an oven still heating up (its status is then not `0`), an
empty till, and both at once.

**Try it:** change `oven-check` on the line before `echo "oven status: $?"` to `oven-chek` and
press **Run**. The shell cannot find a command of that name, says so, and `$?` holds `127`. Then
put the name right again.
