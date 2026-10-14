Write `solution.sh`. It is run as `bash solution.sh FOLDER`, and the starter already stores the
name in the variable `folder`. `FOLDER` is a folder in the current directory, given by its name
alone (no `/`); the name may contain spaces.

1. Create `FOLDER.tar.gz` in the current directory: a tar archive of `FOLDER`, compressed with
   gzip. Its member names start with `FOLDER/`, and it holds everything inside `FOLDER`: every
   file at every depth, empty folders and hidden files included.
2. Create `FOLDER.tar.gz.sha256`: the line `sha256sum` prints for the archive, so that running
   `sha256sum -c FOLDER.tar.gz.sha256` in the current directory prints `FOLDER.tar.gz: OK`.
3. Print the members of the archive that are files, read from the archive itself, sorted. Leave
   out the folder entries, which are the ones that end in `/`.
4. Leave `FOLDER` itself exactly as it was.

The visible test builds the folder `shoot` from the files in `data/`:

```text
shoot/contact-sheet.txt
shoot/selects.txt
shoot/raw/IMG_0412.txt
shoot/raw/IMG_0413.txt
```

`bash solution.sh shoot` creates `shoot.tar.gz` and `shoot.tar.gz.sha256`, and prints:

```text
shoot/contact-sheet.txt
shoot/raw/IMG_0412.txt
shoot/raw/IMG_0413.txt
shoot/selects.txt
```

**Tips.**
- The archive's name comes straight after `-f`. Check what you made with `file shoot.tar.gz`
  and `tar -tzf shoot.tar.gz`.
- Name the folder itself when you archive it, not `FOLDER/*`: a wildcard skips hidden files.
- `sha256sum NAME` prints the checksum followed by `NAME`, exactly as you wrote it.
