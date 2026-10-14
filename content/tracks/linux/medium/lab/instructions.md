Write `solution.sh`. It is run as `bash solution.sh DIRECTORY`.

1. **Arguments.** If no argument is given, or the argument is not a directory, print exactly
   `usage: solution.sh DIRECTORY` on standard error, print nothing on standard output, and exit
   with status `2`.
2. **Files.** Read every regular file whose name ends in `.csv` (lower case), in `DIRECTORY` or in
   any directory below it. Ignore every other file. File and directory names may contain spaces.
3. **Lines.** Every line of every file counts, including a last line that has no newline after
   it. A carriage return (`\r`) at the end of a line is not part of the line.
4. **Lines to skip.** Skip these lines without counting them anywhere:
   - blank lines: empty, or only spaces and tabs;
   - comments: the first character that is not a space or a tab is `#`;
   - headers: the first field, without the spaces around it, is exactly `date`.
5. **Records.** Every other line is a record, `date,employee,project,hours`, with fields
   separated by commas. Spaces and tabs at the start or end of a field are not part of it. A
   record is **valid** when all of these hold:
   - it has exactly four fields;
   - the date has the form `YYYY-MM-DD`: four digits, a hyphen, two digits, a hyphen, two digits;
   - the project is not empty;
   - the hours are one or more digits, optionally followed by a point and **one** digit. `8`,
     `7.5` and `0.5` are valid; `.5`, `7.25`, `-2`, `8h` and an empty field are not.

   Every record that is not valid is **rejected**.
6. **Projects.** Project names are not case-sensitive: `Apollo`, `APOLLO` and ` apollo ` are all
   the project `apollo`, and the report uses the lower-case name. Project names never contain
   spaces inside them.
7. **Report.** Print one line per project, `<project> <hours>`, with the hours of all its valid
   records added up and printed with exactly one decimal place. Put the project with the most
   hours first; projects with equal hours are ordered by name, as `sort` orders them. Then print
   two more lines: `total <hours>`, the hours of all valid records with one decimal place, and
   `rejected <count>`.
8. Exit with status `0` after printing the report, even when no file or no valid record was found.

For the sample folder `data/` (`bash solution.sh data`) the report is:

```text
apollo 22.5
borealis 14.0
cygnus 6.0
total 42.5
rejected 2
```

The two rejected lines are Ben's `7,5` (five fields) and `seven`. `README.txt` is not a
timesheet, whatever it contains.

**Tools available:** `bash`, `find`, `xargs`, `grep`, `sed`, `awk`, `sort`, `uniq`, `cut`, `tr`.

**Tips.**
- Build it in stages and look at the output of each: list the files, then print their lines,
  then clean the lines, then add up.
- Try your script on a folder of your own with awkward cases: a file name with a space, a file
  saved with `printf 'a,b\r\n'`, and a file whose last line has no newline. What does `cat` do
  with two such files?
- awk can do arithmetic with decimals and print them with `printf "%.1f"`; Bash arithmetic
  cannot.
