---
title: Argument Parsing with getopts
summary: Give a script the command-line interface people expect, with short options parsed by `getopts`, a usage message, distinct exit codes for misuse, `--` to end the options, and long options handled by a plain `while` and `case` loop.
minutes: 25
objectives:
  - Name the parts of a command line (options, option arguments, operands, `--`) and the conventions users expect of them
  - Parse short options with `getopts` in silent mode, including options that take a value, and remove them with `shift`
  - Validate option values and operands, print a usage message, and exit with status 2 on misuse
  - Parse long options such as `--keep=14` with a `while` and `case` loop
---

## Outline

1. The parts of a command line
2. A usage message and exit codes
3. Parsing with `getopts`
4. After the loop: operands and validation
5. Long options

## The parts of a command line

Take `tar -czf site.tar.gz -C /srv www`. Users have strong expectations about lines like this, and a script that follows them feels like a real tool.

- An **option** is a word that starts with `-` and changes behaviour: `-c`, `-z`. Short options are one letter and can be **combined**: `-cz` means `-c -z`.
- An **option argument** is the value an option takes: `site.tar.gz` for `-f`. It may be the next word or attached (`-fsite.tar.gz`).
- An **operand** (or positional argument) is what the command works on: `www`.
- **`--`** means "end of options": every word after it is an operand, even `-odd-name`. It is how users pass file names that begin with a dash.

The POSIX convention is that options come before operands, and parsing stops at the first operand or at `--`.

## A usage message and exit codes

A **usage message** is the short summary a tool prints for `-h` or when it is called wrongly: the synopsis line, then one line per option. Put it in a function so every error path can show it. Two rules make it behave well:

- For `-h`, print it on **standard output** and exit 0. The user asked for it, and may want to pipe it into `less`.
- For a mistake, print a one-line reason and the usage on **standard error** and exit **2**. Bash's own builtins and tools such as `grep` use 2 for incorrect usage, which lets a caller tell "you called me wrongly" (2) from "I tried and failed" (1).

## Parsing with `getopts`

`getopts` is a Bash builtin that reads one option per call. Its first argument, the **option string**, lists the letters the script accepts; a letter followed by `:` takes an argument. Each call stores the letter in the variable you name and, for options with a value, the value in `OPTARG`. It returns false when the options run out, which ends the `while` loop. `OPTIND` is the index of the next argument to read.

A `:` at the very *start* of the option string selects **silent mode**: `getopts` prints no messages and reports problems to you instead. For an unknown option the variable is set to `?` and `OPTARG` to the letter; for a missing value it is set to `:` and `OPTARG` to the letter. Silent mode lets you write the messages and choose the exit code.

```bash
#!/usr/bin/env bash
set -euo pipefail
prog=${0##*/}

usage() {
  printf 'Usage: %s [-hnv] [-k DAYS] SOURCE DEST\n' "$prog"
  printf '  -k DAYS  keep snapshots for DAYS days (default 7)\n'
  printf '  -n       dry run: show what would happen\n'
  printf '  -v       more output (repeat for even more)\n'
  printf '  -h       show this help\n'
}
usage_error() {
  printf '%s: %s\n' "$prog" "$1" >&2
  usage >&2
  exit 2
}

keep=7 dry_run=0 verbose=0
while getopts ':hnvk:' opt; do
  case $opt in
    h) usage; exit 0 ;;
    n) dry_run=1 ;;
    v) verbose=$((verbose + 1)) ;;
    k) keep=$OPTARG ;;
    :) usage_error "option -$OPTARG needs a value" ;;
    \?) usage_error "unknown option -$OPTARG" ;;
  esac
done
shift $((OPTIND - 1))

[[ $keep =~ ^[0-9]+$ ]] || usage_error "-k needs a whole number, not '$keep'"
(( $# == 2 )) || usage_error "expected SOURCE and DEST, got $# argument(s)"

echo "keep=$keep dry_run=$dry_run verbose=$verbose source=$1 dest=$2"
```

Saved as `snapshot.sh`, it accepts the usual spellings:

```bash
bash snapshot.sh -vn -k 30 /srv/data /backup
bash snapshot.sh -k30 -v -v /srv/data /backup
```

```text
keep=30 dry_run=1 verbose=1 source=/srv/data dest=/backup
keep=30 dry_run=0 verbose=2 source=/srv/data dest=/backup
```

The `\?` in the `case` is escaped because a bare `?` is a pattern that matches any single character. Defaults are set *before* the loop, so a variable with the same name in the environment cannot leak in.

## After the loop: operands and validation

When `getopts` stops, `OPTIND` points at the first operand. `shift $((OPTIND - 1))` discards the options, leaving only the operands in `"$@"`. Now validate: `getopts` knows that `-k` needs a value but not that it must be a number, and it knows nothing about how many operands you need. Check both, and report misuse through the same `usage_error`.

```bash
bash snapshot.sh -k ten /srv/data /backup; echo "status $?"
bash snapshot.sh -x /srv/data /backup 2>/dev/null; echo "status $?"
bash snapshot.sh -n -- -odd-name /backup
bash snapshot.sh /srv/data -n /backup 2>&1 | head -1
```

```text
snapshot.sh: -k needs a whole number, not 'ten'
Usage: snapshot.sh [-hnv] [-k DAYS] SOURCE DEST
  -k DAYS  keep snapshots for DAYS days (default 7)
  -n       dry run: show what would happen
  -v       more output (repeat for even more)
  -h       show this help
status 2
status 2
keep=7 dry_run=1 verbose=0 source=-odd-name dest=/backup
snapshot.sh: expected SOURCE and DEST, got 3 argument(s)
```

The third command shows `--` at work: `-odd-name` became the source instead of an unknown option. The last shows the POSIX rule: parsing stopped at the operand `/srv/data`, so `-n` was taken as a second operand and the count check caught it. If you want options anywhere on the line, you have to write your own loop, as in the next section.

Without the leading `:`, `getopts` prints its own messages (`illegal option -- x`, `option requires an argument -- k`), sets the variable to `?` for both problems, and leaves `OPTARG` unset, so you cannot tell the user which letter was wrong.

## Long options

`getopts` parses only single-letter options. For GNU-style long options such as `--dry-run` and `--keep=14`, write the loop yourself. `case` matches the current word, `shift` consumes it, and an option with a separate value consumes one more word after checking that it exists.

```bash
#!/usr/bin/env bash
set -euo pipefail
die() { printf 'snapshot: %s\n' "$1" >&2; exit 2; }

keep=7 dry_run=0
while (( $# > 0 )); do
  case $1 in
    -n|--dry-run) dry_run=1 ;;
    -k|--keep)
      (( $# >= 2 )) || die "$1 needs a value"
      keep=$2
      shift ;;
    --keep=*) keep=${1#*=} ;;
    --) shift; break ;;
    -?*) die "unknown option $1" ;;
    *) break ;;
  esac
  shift
done
echo "keep=$keep dry_run=$dry_run operands: $*"
```

```bash
bash long.sh --dry-run --keep=14 /srv/data /backup
bash long.sh -k 3 -- --weird /backup
bash long.sh --kepe 3 /srv/data; echo "status $?"
```

```text
keep=14 dry_run=1 operands: /srv/data /backup
keep=3 dry_run=0 operands: --weird /backup
snapshot: unknown option --kepe
status 2
```

`${1#*=}` (lesson 2) removes everything up to the `=`. The pattern `-?*` matches a dash followed by at least one character, so a lone `-` (which many tools read as "standard input") falls through to `*` as an operand. This loop does not split combined letters such as `-nv`; that is the trade-off for long options. The external `getopt` command can do both, but its behaviour differs between systems, and Greg's Wiki advises against it.

## Common mistakes

- **Forgetting `shift $((OPTIND - 1))`**, so the options are still in `"$@"` when you read the operands.
- **Writing `?)` instead of `\?)`.** The unescaped pattern matches every one-letter value.
- **Using `getopts` inside a function twice** without `local OPTIND`: `OPTIND` is not reset, so the second call sees nothing.
- **Usage on standard output for errors**, or exit status 0 or 1 for misuse.
- **Trusting option values.** `getopts` checks that a value is present, not that it makes sense.

## Practice

1. Add an `-o FILE` option to `snapshot.sh` that defaults to `snapshot.log`.
2. A user runs `bash snapshot.sh -k`. Which branch of the `case` runs, and what is `OPTARG`?
3. How should a user pass a source directory literally named `-n`?

### Answers

1. Add `o:` to the option string (`':hnvk:o:'`), set `out=snapshot.log` with the other defaults, add the branch `o) out=$OPTARG ;;` and a line for `-o FILE` in `usage`.
2. The `:)` branch, because silent mode reports a missing value as `:`. `OPTARG` holds `k`, the option that needed it, so the message reads `option -k needs a value`, and the script exits 2.
3. With `--`: `bash snapshot.sh -- -n /backup`. The path form `./-n` works too, because it no longer starts with a dash.

## Key takeaways

- Options first, then operands; `--` ends the options.
- `while getopts ':ab:' opt` with a `case` per letter, then `shift $((OPTIND - 1))`.
- The leading `:` gives silent mode: `?` for unknown options, `:` for missing values, the letter in `OPTARG`.
- `-h` prints usage to standard output and exits 0; misuse prints to standard error and exits 2.
- Long options need a hand-written `while (( $# > 0 ))` and `case` loop.

## Further reading

- [Bash Reference Manual (Chet Ramey's copy): Bourne Shell Builtins, `getopts`](https://tiswww.case.edu/php/chet/bash/bashref.html#Bourne-Shell-Builtins)
- [Greg's Wiki: BashFAQ 35, handling command-line options](https://mywiki.wooledge.org/BashFAQ/035)
