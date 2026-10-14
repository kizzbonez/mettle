Complete `main` in `solution.sh`. The usage text, `usage_error` and `die` are written for you.
The tests run the script as

```text
bash solution.sh [-hn] [-c COPIES] [-s SIDES] [-p PRINTER] [--] FILE...
```

| Option | Meaning |
| --- | --- |
| `-c COPIES` | copies of each file: digits only, from 1 to 99. Default 1. |
| `-s SIDES` | `one` or `two`, exactly. Default `one`. |
| `-p PRINTER` | the printer: any text that is not empty. Default `front-desk`. |
| `-n` | dry run. |
| `-h` | print the usage on **standard output** and exit with status 0. |

1. Parse the options with `getopts` in silent mode, so that combined (`-nc3`) and attached
   (`-c3`) forms work, and remove them with `shift`. Options come first: parsing stops at the
   first FILE or at `--`, and every word after that is a FILE, even one that starts with `-`.
   When an option is given twice, the last value wins.
2. **Incorrect usage** exits with status **2**, prints nothing on standard output, and goes
   through `usage_error`, which prints `lpjob: REASON` and the usage on standard error. For an
   unknown option the reason is exactly `unknown option -X`, and for an option without its value
   exactly `option -X needs a value`, where X is the letter. A COPIES, SIDES or PRINTER that breaks
   the rules above, or no FILE at all, is also incorrect usage (word those reasons as you like).
   Check all of this before looking at the files.
3. If a FILE is not a readable regular file, call `die "cannot read FILE"` (status **1**) before
   printing anything, even when other files are fine.
4. Otherwise print one line per FILE, in order, and exit with status 0:
   `queued FILE (copies=C, sides=S, printer=P)`, or with `-n`,
   `would queue FILE (copies=C, sides=S, printer=P)`. COPIES is printed as it was given.

Example, in a directory holding `report.pdf` and `q3 summary.pdf`:

```text
$ bash solution.sh -n -c 2 -s two report.pdf "q3 summary.pdf"
would queue report.pdf (copies=2, sides=two, printer=front-desk)
would queue q3 summary.pdf (copies=2, sides=two, printer=front-desk)
$ bash solution.sh -c 2 -x report.pdf
lpjob: unknown option -x
Usage: lpjob [-hn] [-c COPIES] [-s SIDES] [-p PRINTER] [--] FILE...
...
$ echo $?
2
```
