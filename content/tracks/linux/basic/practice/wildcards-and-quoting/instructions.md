The tests make a recording folder, go into it and run your script there:

```bash
bash solution.sh
```

Each test has different files in it, so select them with wildcards rather than typing each name.
Write one command for each task:

1. With a single `mkdir` and brace expansion, create the folders `episode/takes` and
   `episode/notes`.
2. Copy the takes numbered 1 to 9 into `episode/takes`: the files whose names are `take-`, then
   exactly one character, then `.wav`. `take-10.wav` and higher stay out.
3. Copy every file whose name ends in `.txt` into `episode/notes`. Some of these names contain
   spaces. Hidden files (names starting with `.`) are not copied.
4. Delete the file named `rough cut.wav`, with its space, and no other file.
5. Print exactly this line, quotes and stars included:

   ```text
   Next week: "Rivers & Bridges" at 8:00, *live*
   ```

Copy, never move: every file the script copies must still be in the recording folder afterwards.
The script prints only the line of task 5 and no error messages. Every test folder has at least
one single-digit take and at least one `.txt` file.

The visible test runs the script in a folder holding these ten files:

```text
.session-lock
guest bio.txt
intro.wav
rough cut.wav
show notes.txt
take-1.wav
take-10.wav
take-11.wav
take-2.wav
take-3.wav
```

The script prints the line of task 5. Afterwards `episode/takes` holds `take-1.wav`, `take-2.wav` and `take-3.wav`, `episode/notes`
holds `guest bio.txt` and `show notes.txt`, and `rough cut.wav` is gone. The hidden tests add
takes such as `take-100.wav` and `take-5.wav.bak`, hidden `.txt` files, and files called
`cut.wav` and `rough mix.wav` that must survive.
