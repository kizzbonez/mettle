Write `solution.sh`. It is run as `bash solution.sh FILE` and decides whether `FILE` may be
uploaded. Make these checks **in this order** and stop at the first one that applies:

1. **Arguments.** If there is not exactly one argument, print `usage: solution.sh FILE` on
   standard error, nothing on standard output, and exit with status `2`.
2. **Not a file.** If `FILE` does not exist or is not a regular file (a directory, for example),
   print `not a file: FILE` on standard error, with the name as it was given, nothing on standard
   output, and exit with status `2`.
3. **Empty.** If `FILE` is empty, print `rejected: empty` and exit with status `1`.
4. **Kind.** The end of the name decides the kind, in lower case only:
   - `.txt` or `.md`: a **text**, allowed up to **100** bytes;
   - `.png` or `.jpg`: an **image**, allowed up to **1000** bytes;
   - any other name, such as `setup.exe`, `notes.txt.bak`, `README` or `PHOTO.PNG`: print
     `rejected: type` and exit with status `1`.
5. **Size.** If `FILE` has more bytes than its kind allows, print `rejected: too large` and exit
   with status `1`. Exactly the limit is allowed.
6. Otherwise print `accepted: text` or `accepted: image` and exit with status `0`.

Example:

```text
$ bash solution.sh data/notes.txt
accepted: text
$ head -c 1200 /dev/zero > diagram.png
$ bash solution.sh diagram.png
rejected: too large
```

The first run exits with status `0` (the note is 53 bytes), the second with status `1`.

**Tips.**
- `$#` is the number of arguments, and `>&2` sends a message to standard error.
- `case` matches the name against patterns such as `*.txt | *.md)`; it can set both the kind and
  the limit in one branch.
- `wc -c < FILE` prints the size in bytes. Compare numbers with `-gt`, not `>`.
