Write `solution.sh`. It is run as `bash solution.sh DIR`, and the starter already stores the
folder in the variable `dir`. Names of files and folders, including `DIR`, may contain spaces.

1. **Delete** every regular file anywhere below `DIR` that is either
   - named `*.tmp` **and** last modified more than 7 days ago, or
   - empty (0 bytes), whatever its name and age.

   Never delete a directory, not even an empty one or one whose name ends in `.tmp`. A `.tmp`
   file changed in the last few days stays.
2. **Print** the path of every file you deleted, as `find` prints it (starting with `DIR`), one
   per line, sorted.
3. **Count**: after the deletions, print `errors: N`, where `N` is the number of lines containing
   `ERROR` (in capitals) in all the files below `DIR` whose names end in `.log`. Other files do
   not count, whatever they contain.

The visible test builds this folder `farm` from the files in `data/`:

```text
farm/frames/f001.tmp            1 byte, modified 30 days ago
farm/frames/f002.tmp            1 byte, modified just now
farm/frames/f003.png            empty
farm/logs/render.log            a copy of data/render.log (2 ERROR lines)
farm/logs/old runs/batch 12.log a copy of data/batch.log (2 ERROR lines)
farm/notes.txt                  a copy of data/notes.txt
```

`bash solution.sh farm` then prints:

```text
farm/frames/f001.tmp
farm/frames/f003.png
errors: 4
```

**Tips.**
- Run your `find` with `-print` alone first and read the list before you add `-delete`.
- "Either ... or ..." needs `-o` and escaped parentheses; check which tests apply to which half.
- `touch -d '30 days ago' FILE` makes a file look old, for trying your script.
- `grep` prints one line per match even when it reads many files, so `wc -l` can count them.
  Connect `find` and `xargs` so that names with spaces survive.
