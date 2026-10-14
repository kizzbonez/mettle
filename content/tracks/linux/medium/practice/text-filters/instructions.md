Write `solution.sh`. It is run as `bash solution.sh FILE`, and the starter already stores the
file name in the variable `file`. The name may contain spaces, so write `"$file"`.

1. `FILE` is a loans export. Its first line is always the header `date,member,title`; every other
   line is one loan, three fields separated by commas. Titles never contain commas but may contain
   spaces.
2. Titles that differ only in upper and lower case are the same book: `The Hobbit`, `THE HOBBIT`
   and `the hobbit` all count as `the hobbit`. Print titles in lower case.
3. Some exports come from a Windows PC, so their lines may end in a carriage return (`\r`). It is
   not part of the title.
4. Print the **three** most borrowed titles with their number of loans, in exactly the format
   `uniq -c` prints: the count right-aligned in seven characters, a space, then the title.
   - Most loans first.
   - Titles with the same number of loans are in alphabetical order, as `sort` orders them.
   - If the file has fewer than three titles, print them all. A file with only the header prints
     nothing.

For the sample file (`bash solution.sh data/loans.csv`) the output is:

```text
      3 dune
      3 the hobbit
      2 emma
```

`Dune` was borrowed as `Dune`, `DUNE` and `Dune`; `the hobbit` also has three loans and comes
second because `dune` sorts before it.

**Tip:** build the pipeline one stage at a time and look at the output after each: skip the
header, cut out the title, clean it, then count. Which `sort` options give "count from largest,
then title from A to Z"? The lesson's Practice answers show the trap.
