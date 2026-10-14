---
title: Writing Safe Scripts
summary: Bring the level together into scripts that are safe to run unattended, twice, at the same time and on any file name, using `mktemp`, atomic replacement with `mv`, `flock`, idempotent steps and NUL-separated file lists.
minutes: 30
objectives:
  - Create temporary files and directories with `mktemp` and remove them on every exit
  - Replace a file atomically by writing a temporary file beside it and renaming it
  - Stop two copies of a script running at once with `flock`
  - Make a script idempotent, and process file names containing spaces, newlines and leading dashes from start to end
---

## Outline

1. What "safe" means for a script
2. Temporary files with `mktemp`
3. Replacing files atomically
4. One copy at a time with `flock`
5. Idempotent scripts
6. Odd file names, end to end

## What "safe" means for a script

A script that runs from `cron` at 03:00 has no one watching it. It is safe when it fails loudly (lesson 3), cleans up after itself, leaves no half-written files, refuses to run twice at once, can simply be run again after a failure, and works on every file name the system allows. Each section below adds one of these properties.

## Temporary files with `mktemp`

A fixed name such as `/tmp/report.$$` is predictable: two runs can collide, and another user can create that name first as a symbolic link to one of your files, so your script writes through the link. `mktemp` creates a new file with a random name **atomically** (the check that the name is free and the creation are one indivisible step) and prints the name. The file is readable and writable only by you; `mktemp -d` creates a private directory instead.

`mktemp` uses `$TMPDIR` if set and `/tmp` otherwise. `-p DIR` chooses the directory, a template such as `upload.XXXXXX` chooses the name (the `X`s become random characters), and `--suffix=.csv` adds an ending.

```bash
#!/usr/bin/env bash
set -euo pipefail
scratch=$(mktemp -d)
trap 'rm -rf -- "$scratch"' EXIT

echo "scratch directory: $scratch"
ls -ld "$scratch" | cut -c1-10
csv=$(mktemp --suffix=.csv)
ls -l "$csv" | cut -c1-10
rm -f -- "$csv"
mktemp -p "$scratch" upload.XXXXXX
```

```text
scratch directory: /tmp/tmp.tcNWuBDXyF
drwx------
-rw-------
/tmp/tmp.tcNWuBDXyF/upload.S5PkRB
```

The random parts differ on every run, and afterwards `/tmp` is empty again. One temporary directory per script, trapped at once, is the simplest pattern: every scratch file goes inside it, and one `rm -rf` cleans up.

## Replacing files atomically

Writing straight into a file that others read is risky: a reader can see it half-written, and if the script dies halfway the old content is already gone. Instead, write a temporary file **in the same directory** and then `mv` it over the target. Within one file system, `mv` is a **rename**, which the kernel performs atomically: readers see either the old file or the new one, never a mix. A temporary file in `/tmp` would not do, because moving across file systems is a copy.

```bash
write_atomically() {
  local target=$1 tmp
  tmp=$(mktemp "$target.XXXXXX") || return
  if ! cat > "$tmp"; then
    rm -f -- "$tmp"
    return 1
  fi
  chmod 644 -- "$tmp"
  mv -f -- "$tmp" "$target"
}

printf 'listen 8080\nworkers 4\n' | write_atomically app.conf
cat app.conf
ls -l app.conf | cut -c1-10
```

```text
listen 8080
workers 4
-rw-r--r--
```

The `chmod` matters: `mktemp` files are private (`-rw-------`), and after the rename the configuration file would be unreadable for the service that needs it. The same pattern is how to "edit" a file with `jq` or `sort`, which cannot write to the file they are reading.

## One copy at a time with `flock`

If a nightly job is still running when the next one starts, two copies work on the same files. A **lock** prevents that. Checking whether a lock file exists and then creating it is a race: two copies can both check before either creates. `flock` from util-linux asks the kernel for a lock on an open file instead. The kernel grants it to one process at a time and releases it automatically when the file is closed, which happens when the script exits however it exits, so a crash cannot leave a stale lock.

```bash
#!/usr/bin/env bash
set -euo pipefail
exec 9> /tmp/nightly.lock
if ! flock -n 9; then
  echo "run $1: another run holds the lock, exiting" >&2
  exit 3
fi
echo "run $1: got the lock, working"
sleep 2
echo "run $1: done"
```

Started as `bash nightly.sh A &`, then half a second later `bash nightly.sh B`, and after both have finished, `bash nightly.sh C`:

```text
run A: got the lock, working
run B: another run holds the lock, exiting
run B status 3
run A: done
run C: got the lock, working
run C: done
run C status 0
```

`exec 9> file` opens the file on **file descriptor** 9 (a numbered handle for an open file) for the rest of the script. `flock -n 9` takes an exclusive lock on it, or fails at once (`-n`, non-blocking) if another process holds it; `-w 10` would wait up to ten seconds instead. The order of the lines depends on timing, which is the point of the example. One caution: background children inherit descriptor 9, and the lock is held until every copy of it is closed.

## Idempotent scripts

An operation is **idempotent** when doing it twice has the same effect as doing it once. Scripts that set something up should be, so that after a failure you can simply run them again. Most commands have an idempotent form, or can be guarded by a check:

```bash
add_line() {
  local line=$1 file=$2
  grep -qxF -- "$line" "$file" 2>/dev/null || printf '%s\n' "$line" >> "$file"
}
mkdir -p app/releases app/shared
ln -sfn releases/v2 app/current
add_line 'export APP_ENV=prod' app/env.sh
```

Run twice, then inspected:

```text
export APP_ENV=prod
app/current -> releases/v2
```

The naive version, `mkdir app` and `echo ... >> app/env.sh`, fails on the second run with `File exists` and, if it carried on, would append the line a second time. `mkdir -p` succeeds when the directory exists; `ln -sfn` replaces an existing link instead of creating a link inside the directory it points to; `grep -qxF` checks for the exact whole line (`-x`), as fixed text (`-F`), quietly (`-q`).

## Odd file names, end to end

On Linux a file name may contain anything except `/` and the NUL byte (the byte with value zero): spaces, `*`, newlines, a leading `-`. A safe script handles them at every step:

1. **Get** names from a glob (`./*.txt`) or `find -print0`, never from `ls` output.
2. **Store** them in arrays, never in space-separated strings.
3. **Expand** them quoted: `"$f"`, `"${files[@]}"`.
4. **Pass** them after `--` or with a `./` prefix, so `-n.txt` is not an option.
5. **Separate** them with NUL when they travel between commands: `find -print0`, `sort -z`, `xargs -0`, `read -d ''`, `mapfile -d ''`.

```bash
touch 'two words.txt' $'line\nbreak.txt' -- '-n.txt' 'plain.txt'
echo "ls | wc -l says: $(ls | wc -l)"
count=0
while IFS= read -r -d '' f; do
  count=$((count + 1))
  printf 'found %q\n' "$f"
done < <(find . -type f -name '*.txt' -print0 | sort -z)
echo "$count files"
wc -l *.txt
```

```text
ls | wc -l says: 5
found ./-n.txt
found $'./line\nbreak.txt'
found ./plain.txt
found ./two\ words.txt
4 files
wc: invalid option -- 'n'
Try 'wc --help' for more information.
```

`ls | wc -l` counted five files because one name contains a newline. The NUL-separated loop found exactly four: `read -d ''` reads up to a NUL, `IFS=` keeps surrounding spaces, `-r` keeps backslashes, and `printf %q` shows each name unambiguously. In the last command the glob produced `-n.txt`, which `wc` took as an option; `wc -l -- *.txt` works. And set `shopt -s nullglob` when a glob may match nothing, or the loop runs once with the pattern itself as the "name".

## Common mistakes

- **Predictable temporary names** such as `/tmp/name.$$`.
- **Writing the temporary file in `/tmp` and moving it elsewhere**, which is not atomic.
- **A lock file checked with `[ -e ]`**, which races and goes stale after a crash.
- **Appending configuration lines without checking**, which duplicates them on every run.
- **`for f in $(find ...)`**, which splits names on spaces and newlines.

## Practice

1. Rewrite `jq '.version = "2.0"' app.json > app.json` so that it works and is atomic.
2. A cron job must wait up to 30 seconds for the lock, then give up with status 3. Write the lines that take the lock.
3. Delete every `.tmp` file below `cache/`, whatever the names contain.

### Answers

1. Write beside the target, then rename only on success; the original never empties (add a `chmod` before the `mv` if other users must read the file):

   ```bash
   tmp=$(mktemp app.json.XXXXXX)
   trap 'rm -f -- "$tmp"' EXIT
   jq '.version = "2.0"' app.json > "$tmp" && mv -- "$tmp" app.json
   ```

2. `exec 9> /tmp/job.lock` then `flock -w 30 9 || exit 3`.
3. `find cache -type f -name '*.tmp' -delete`, or `find cache -type f -name '*.tmp' -print0 | xargs -0 rm -f --`. Both keep names intact, because no step splits on spaces or newlines.

## Key takeaways

- `mktemp` (or `mktemp -d`) plus `trap ... EXIT` for every scratch file.
- Write beside the target and `mv` over it, which readers see as one step.
- `exec 9> lock; flock -n 9 || exit` allows one copy; the kernel releases it on exit.
- Use `mkdir -p`, `ln -sfn` and guarded appends so scripts can run twice.
- Names travel as globs, arrays, quoted expansions and NUL-separated lists, behind `--`.

## Further reading

- [Linux manual page: mktemp(1)](https://man7.org/linux/man-pages/man1/mktemp.1.html)
- [Linux manual page: flock(1)](https://man7.org/linux/man-pages/man1/flock.1.html)
- [Greg's Wiki: BashFAQ 20, file names with spaces, newlines and other characters](https://mywiki.wooledge.org/BashFAQ/020)
- [Greg's Wiki: BashFAQ 45, making sure only one copy of a script runs](https://mywiki.wooledge.org/BashFAQ/045)
