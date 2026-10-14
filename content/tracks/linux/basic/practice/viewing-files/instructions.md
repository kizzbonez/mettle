The tests make a folder holding two files, `bookings.log` and `poster.png`, go into it and run
your script there:

```bash
bash solution.sh
```

`bookings.log` has a header line and then one booking per line, oldest first. Each test uses a
different log, some long and some short, so your commands must not depend on how many lines the
example has. The starter prints four headings; under each one, write one command:

1. **header**: the first line of `bookings.log`, and nothing else.
2. **latest**: the last three lines of `bookings.log`. When the log is shorter, whatever the last
   three lines are, header included.
3. **count**: the number of lines in `bookings.log` followed by its name, as `wc` prints them when
   asked for lines only.
4. **poster**: what `poster.png` really contains, judged by its content, not its name.

The visible test uses the files in `data/`. Its log is:

```text
time,lane,swimmer
06:30,1,Morgan
07:00,2,Priya
07:30,1,Tomasz
08:00,3,Aisha
08:30,2,Lena
09:00,1,Kofi
```

and `poster.png` holds one line of text. For them the script prints:

```text
== header ==
time,lane,swimmer
== latest ==
08:00,3,Aisha
08:30,2,Lena
09:00,1,Kofi
== count ==
7 bookings.log
== poster ==
poster.png: ASCII text
```

The hidden tests use a log of fifteen lines, a log with a single booking, and an empty
`poster.png`.
