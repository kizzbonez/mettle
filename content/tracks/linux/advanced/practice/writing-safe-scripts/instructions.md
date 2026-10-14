Complete `solution.sh`. The tests run it as `bash solution.sh LIST ENTRY...`, where LIST is the
allowlist file, one entry per line, and every ENTRY is a non-empty line of text that may contain
spaces, glob characters or a leading dash. The usage check (status 2) is written for you. The
last test runs **`shellcheck solution.sh`**, which must report nothing.

1. **One run at a time.** Open `LIST.lock` (LIST's name plus `.lock`) on file descriptor 9 with
   `exec 9> ...` and take the lock with `flock -n 9`. If another process holds it, print
   `allowlist: LIST is locked by another run` on standard error and exit with status **3**,
   leaving LIST as it was. The lock file itself may stay.
2. **A temporary file beside LIST.** Create it with `mktemp`, in the same directory as LIST,
   and set an `EXIT` trap that removes it, so that no `LIST.XXXXXX` file is ever left behind.
   The tests set `TMPDIR` to a directory nobody may write to: a temporary file anywhere else
   makes the run fail. Copy LIST into it when LIST exists (a missing LIST counts as empty).
3. **Each entry once.** For each ENTRY, in order: if it is not already a **whole line** of the
   temporary file (compared as fixed text: `web` is not `web01`, and `a.b` is not `axb`), append
   it and print `added ENTRY`. An ENTRY given twice is added once. Then print `N added`.
4. **Atomic replacement.** If anything was added, `chmod 644` the temporary file and `mv` it
   over LIST, so readers see the old list or the new one, never half of one. If nothing was
   added, leave LIST completely alone: do not replace it.
5. Exit with status 0 after a successful run.

Example, in a directory that holds only a copy of `data/allow.txt` named `allow.txt`:

```text
$ bash solution.sh allow.txt web02 'db 01' --help web02
added web02
added --help
2 added
$ cat allow.txt
web01
db 01
web02
--help
$ bash solution.sh allow.txt web02
0 added
$ ls
allow.txt  allow.txt.lock
```
