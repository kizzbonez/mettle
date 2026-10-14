The tests make a folder holding the program `tools/badge`, go into it and run your script there
with two arguments, the runner's name and bib number:

```bash
bash solution.sh "Ada Lovelace" 42
```

`badge` reads two **environment variables**, `RUNNER` and `BIB`, prints the badge line
`BADGE <runner> #<bib>`, and adds a line for the badge to `badges.log` in the working directory.
When it cannot see a variable, it prints `?` in its place. Write the script in four steps:

1. Print `Runner: ` followed by the first argument, then `Bib: ` followed by the second. Print
   them exactly as given: a name may contain spaces, even two in a row, and a bib may start with
   `0`.
2. Make `RUNNER` (the first argument) and `BIB` (the second) visible to the programs your script
   starts.
3. Put the folder `tools` in the working directory **in front of** the directories in `PATH`, and
   keep the rest of `PATH`, so that `badge` runs by name and wins over any other program called
   `badge`. `$PWD` holds the working directory. Then run `badge`.
4. Print `Badges printed today: ` followed by the number of lines in `badges.log` after `badge`
   ran, only the number. Earlier runners may already be in the log.

For the visible test, run as above with no `badges.log` yet, the script prints:

```text
Runner: Ada Lovelace
Bib: 42
BADGE Ada Lovelace #42
Badges printed today: 1
```

The hidden tests use a name with two spaces and an apostrophe, a bib with a leading zero, a log
that already holds several badges, and another program called `badge` that comes earlier in the
`PATH` the script starts with.
