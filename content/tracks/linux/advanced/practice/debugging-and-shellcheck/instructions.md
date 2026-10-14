The starter `solution.sh` works on simple folder names only. Repair it. The tests run it as
`bash solution.sh DIR`, sometimes with `ALBUM_TRACE=1` in the environment, and the last test runs
**`shellcheck solution.sh`**, which must report nothing at all.

1. Every subdirectory directly inside DIR whose name does not start with a dot is an **album**.
   For each, in the order the glob `*` gives, print `ALBUM: N photos`, where N counts the
   **regular files** directly in the album whose names end in `.jpg` (so not `.JPG`, not a
   directory called `x.jpg`, and not hidden files such as `.cover.jpg`). Then print
   `total: N photos`. Files directly inside DIR are not albums. Exit with status 0.
2. Album and DIR names may contain spaces, glob characters such as `[` and `]`, or start with
   `-`. Loop over globs instead of `ls`, quote every expansion, and give `cd` a `--`.
3. When DIR cannot be entered, print exactly one line, `album-report: cannot enter DIR`, on
   standard error (hide `cd`'s own message), print nothing on standard output, and exit with
   status 1. Test `cd` directly instead of reading `$?` afterwards.
4. When the environment variable `ALBUM_TRACE` is `1`, set
   `PS4='+ ${LINENO}:${FUNCNAME[0]:-main}: '` and turn on `set -x` straight after entering DIR,
   so that every traced line shows its line number and function. Standard output must not change.
   Without `ALBUM_TRACE`, or with any other value, nothing is printed on standard error.
5. Run `bash -n solution.sh` and `shellcheck solution.sh` until both are silent. Fix the code
   rather than adding `# shellcheck disable` directives.

Example, for this directory:

```text
photos/
  2026 summer/   beach.jpg  sunset 2.jpg  notes.txt
  -raw/          a.jpg  b.jpg  c.JPG
  family/        (empty)
  cover.jpg
```

```text
$ bash solution.sh photos
-raw: 2 photos
2026 summer: 2 photos
family: 0 photos
total: 4 photos
$ ALBUM_TRACE=1 bash solution.sh photos 2>&1 >/dev/null | head -n 3
+ 29:main: for album in *
+ 30:main: [[ -d -raw ]]
++ 31:main: count_photos -raw
```

Your line numbers will differ. Lines traced inside `$( )` start with `++`.
