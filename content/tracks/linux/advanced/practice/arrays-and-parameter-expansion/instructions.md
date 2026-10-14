Complete `solution.sh`. The tests run it as `bash solution.sh LIST`, sometimes with the
environment variable `PREFIX` set, as in `PREFIX=s02 bash solution.sh LIST`. LIST is a file with
one path per line. Do it all with arrays and parameter expansion: no `basename`, `sed`, `cut` or
`tr`.

1. Take LIST from `$1`. When it is missing or empty, stop with `${1:?usage: solution.sh LIST}`:
   Bash prints a line ending in `usage: solution.sh LIST` on standard error and exits with
   status 1.
2. Read every line of LIST into an indexed array with `mapfile -t`, and work through it in order.
   Skip empty lines.
3. For each path, the **name** is everything after the last `/` (the whole line when there is no
   `/`). When the name contains a `.`, its **extension** is the text after the **last** dot, in
   lower case, and its **stem** is everything before that dot. A name without a dot has no
   extension, and its stem is the whole name.
4. The **new name** is the stem with **every** space replaced by `_`, all in lower case, followed
   by `.` and the extension if there is one. When `PREFIX` is set and not empty, the new name
   starts with `PREFIX-`. Print `NAME -> NEW NAME` for each path.
5. Count the files of each extension in an associative array, using `(none)` for names without
   one. After the last file, print one `EXT: COUNT` line per extension, sorted with `sort`.
   An empty LIST prints nothing. Exit with status 0.

Example, with `data/takes.txt`:

```text
$ bash solution.sh data/takes.txt
Ep 14 Intro.WAV -> ep_14_intro.wav
Ep 14 Interview Ana.wav -> ep_14_interview_ana.wav
Theme v3.FLAC -> theme_v3.flac
notes.TXT -> notes.txt
Ep 14 Mix.final.wav -> ep_14_mix.final.wav
flac: 1
txt: 1
wav: 3
```

With `PREFIX=s02`, the first line would be `Ep 14 Intro.WAV -> s02-ep_14_intro.wav`.

**Tip:** quote every expansion. A name such as `a*b take.wav` must come out exactly as it went
in, whatever files happen to be in the current directory.
