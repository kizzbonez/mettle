The script in the editor should print the sign for a bookshop window, but it has three mistakes.
Fix them by reading what Python tells you, one error at a time, as the lesson did. The tests run
your file as a script, as `python solution.py` would, and read what it prints.

1. Press **Run**. The script stops with a traceback, the same one `python solution.py` would
   print in a terminal. Read it **from the bottom up**, as in the lesson: the last line names the
   error and explains it; the line above it shows the code that failed, with carets `^^^^^` under
   the exact part; and the `File "/work/solution.py", line ...` entry above that gives the line
   number. `<module>` means the top level of your file.
2. Fix that line and press **Run** again. The script now gets further and stops at the second
   mistake, with an error of the same kind but a different cause. Fix it too.
3. The script now runs to the end, but it still prints a note meant for the staff. Do not delete
   it: turn the whole line into a **comment** by putting `#` at its start, so it stays in the file
   but is no longer printed.
4. Press **Run**. The script must print exactly this sign, five lines with an empty fourth one:

   ```text
   Welcome to Corner Books
   Open 9:00 to 17:30
   Closed on Sundays

   Goodbye
   ```

5. Press **Submit**. The hidden tests check that the script runs to its end, that the staff note
   is a comment, and every line of the sign, character for character.

**Tip:** `NameError: name '...' is not defined` means Python met a name it does not know. Check
the capital letters, and whether text is missing its quotes: without them, a word is a name.
