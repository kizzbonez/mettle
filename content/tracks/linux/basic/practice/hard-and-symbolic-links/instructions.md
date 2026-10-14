The tests make an office folder, go into it and run your script there:

```bash
bash solution.sh
```

The folder holds the file `timetable-2026.txt` and the folders `staff`, `term-1` and `term-2`. Write
one command for each task:

1. **For the printer**: a **hard link** called `timetable.txt` for `timetable-2026.txt`, so that both
   names lead to the same data, and the timetable survives even if someone deletes
   `timetable-2026.txt`.
2. **For the staff room**: a **symbolic link** `staff/timetable.txt` whose target is exactly
   `../timetable-2026.txt`. The target is read from the folder the link is in, and because it is
   relative, the link keeps working when the whole office folder is moved or renamed.
3. **For the head teacher**: a **symbolic link** `latest` whose target is exactly `term-2`, so that
   `latest/dates.txt` opens the dates of term 2. In some tests `latest` exists already and points
   to `term-1`; your command must then replace it. The lesson's section "Copy or link?" shows the
   options for switching such a link.
4. Print the target stored in `staff/timetable.txt`, then the target stored in `latest`, one per
   line.

The script prints only those two lines and no error messages. For the visible test, in a folder
without `latest`, it prints:

```text
../timetable-2026.txt
term-2
```

The tests then read the timetable through every new name, change it through one name and look
through the other, delete `timetable-2026.txt`, move the whole office folder to a name with a space,
and check that the old `latest` was replaced, not added to.
