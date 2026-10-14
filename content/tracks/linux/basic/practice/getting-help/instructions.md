The tests run your script with

```bash
bash solution.sh
```

and compare what it prints with the cheat sheet below. This sandbox has no `man` and gives you no
terminal of your own, but the rest of the help the lesson describes is here: `type`, `help`, and
the `--help` of programs. You use them to find three options you have not met yet. To read a help
text, add the command to `solution.sh` on a line of its own (for example `help type`), press
**Run**, and read it under "Your script printed". Remove those lines before you submit.

The starter already prints the three headings. Under each one:

1. **Kinds.** With a single `type` command, print the kind of `cd`, `date` and `if`, one word per
   line, in that order. `type` on its own prints a whole sentence for each name; `help type` lists
   the option that prints just one word.
2. **pwd.** With `help`, print only the short synopsis of the `pwd` builtin: the single line that
   `help pwd` starts with. `help help` lists the option.
3. **Weekdays.** With `date`, print the name of the weekday of 25 December 2026, then of
   31 December 2026, one per line. `date --help` lists the option that shows a date other than
   now; write the dates as `2026-12-25` and `2026-12-31`, and use the format `+%A`, the full
   weekday name.

`echo` prints only the three headings: every answer line must be printed by `type`, `help` or
`date`, and a hidden test checks your script for that. The finished script prints exactly:

```text
== Kinds ==
builtin
file
keyword
== pwd ==
pwd: pwd [-LP]
== Weekdays ==
Friday
Thursday
```

**How it is judged:** the tests cannot watch you read help pages. They compare what your script
prints, section by section, and they check that the answers come from those three commands.
