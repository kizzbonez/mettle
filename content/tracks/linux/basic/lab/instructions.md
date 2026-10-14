Write `solution.sh`. It is run with two arguments, the upload folder and the release folder to
create:

```bash
bash solution.sh data release-week41
bash solution.sh "uploads/site B" "out/week 42/release"
```

The starter already stores them in the variables `upload` and `release`. Either path may
contain spaces, so always write them in double quotes: `"$upload"`, `"$release"/logs`.

1. **Folders.** Create the release folder with three subfolders: `readings`, `logs` and
   `notes`. Create any missing parent folders too. All three subfolders must exist even if
   nothing is copied into them.
2. **Copy, by name.** From the top level of the upload folder only (not its subfolders), copy:
   - every file whose name ends in `.csv` into `readings`;
   - every file whose name ends in `.log` into `logs`;
   - every file whose name ends in `.txt` into `notes`.

   Hidden files (names starting with `.`) are not copied, and neither is anything else, such as
   `logger.log.1` or `backup.csv.bak`. Copy; never move or change the upload folder. File names
   may contain spaces.
3. **Permissions.**
   - Every file in `readings` and `notes` must be read-only for everyone: mode `444`
     (`r--r--r--`).
   - The `logs` folder must be private to you: mode `700` (`rwx------`).
   - The `readings` and `notes` folders themselves keep the mode `mkdir` gives them, `755`.
4. **README link.** Every upload contains `README.txt`. In the release folder, create a symbolic
   link called `README.txt` whose target is exactly `notes/README.txt`, so that it keeps working
   when the whole release folder is moved or renamed.
5. **Summary.** Print exactly these four lines, and save the same four lines in the file
   `SUMMARY.txt` in the release folder:

   ```text
   readings: <number of files in readings>
   logs: <number of files in logs>
   notes: <number of files in notes>
   errors: <number of lines in the copied log files that contain ERROR>
   ```

   `ERROR` must be in capital letters: a line that says `error` in lower case does not count.
6. **Quiet and successful.** An upload with no CSV files or no log files is normal. In that case
   copy nothing of that kind, report `0`, and do not print anything on standard error. The
   script must always finish with exit status `0`.

For `data/` the output is:

```text
readings: 3
logs: 2
notes: 3
errors: 3
```

**Tools you have learned:** `mkdir`, `cp`, `chmod`, `ln`, `ls`, `cat`, `grep`, `wc`, `echo`,
wildcards, quoting, redirection (`>`, `>>`, `2>`, `/dev/null`), pipes, `tee` and `$( )`.

**Tips:**

- Put quotes around the variable but not around the wildcard: `"$upload"/*.csv`. Inside quotes,
  `*` is just a star.
- A pattern that matches nothing is passed on unchanged, and the command then complains about a
  file called `*.csv`. Decide where that complaint should go.
- A symbolic link's target is read from the folder the link is in, not from where you ran `ln`.
- Count with `ls FOLDER | wc -l`. `grep -c` gives one count per file when it reads several.
