---
title: Command-Line Programs
summary: Build command-line tools that behave like real Unix and Windows commands. Read arguments with sys.argv and argparse (positionals, options, types, choices, defaults, subcommands and help), read standard input, keep results on stdout and diagnostics on stderr, and exit with the right status.
minutes: 35
objectives:
  - Read raw arguments from sys.argv and explain why argparse is better
  - Define positional and optional arguments with types, choices, defaults and help, and add subcommands
  - Send results to stdout and diagnostics to stderr, and accept a file name of `-` for standard input
  - Return exit status 0, 1 or 2 correctly with a testable main(argv=None) function
---

## Outline

1. What a command-line program receives and returns
2. `sys.argv`
3. A program built with argparse
4. Arguments, options, types and defaults
5. Subcommands
6. Streams: stdin, stdout and stderr
7. Exit status
8. Behaving well in pipelines

## What a command-line program receives and returns

A command-line program gets four things from whoever starts it: a list of **arguments**,
**standard input** (stdin), and two output streams, **standard output** (stdout) for results and
**standard error** (stderr) for messages. When it ends, it hands back an **exit status**, a small
integer: 0 means success, anything else failure. Shells, scripts, `make` and CI systems all decide
what to do next from that number, so a tool that prints "error" but exits 0 is lying to them.

## `sys.argv`

`sys.argv` is the list of arguments as strings, with the script name first. The shell has already
split the command line on spaces and removed the quotes:

```python
import sys

print(sys.argv)
```

```console
$ python args.py report --top 3 "my notes.txt"
['args.py', 'report', '--top', '3', 'my notes.txt']
```

Everything is a string, and nothing checks that `--top` has a number after it. Writing that
checking by hand for every program is tedious and inconsistent. The standard library's `argparse`
does it, and writes the help text and error messages too.

## A program built with argparse

`textstat` counts lines and words, or lists the most common words, in files or standard input:

```python
"""textstat: count lines and words, or list the most common words."""
import argparse
import logging
import sys
from collections import Counter

logger = logging.getLogger("textstat")


def read_text(path):
    if path == "-":
        return sys.stdin.read()
    with open(path, encoding="utf-8") as file:
        return file.read()


def cmd_count(args):
    for path in args.files:
        text = read_text(path)
        print(f"{len(text.splitlines())}\t{len(text.split())}\t{path}")
    return 0


def cmd_top(args):
    words = Counter()
    for path in args.files:
        words.update(word.lower() for word in read_text(path).split())
    for word, count in words.most_common(args.number):
        print(f"{count}\t{word}")
    return 0


def build_parser():
    parser = argparse.ArgumentParser(prog="textstat", description=__doc__)
    parser.add_argument("-v", "--verbose", action="store_true", help="log progress to stderr")
    commands = parser.add_subparsers(dest="command", required=True)

    count = commands.add_parser("count", help="lines and words per file")
    count.add_argument("files", nargs="+", metavar="FILE", help="a file, or - for stdin")
    count.set_defaults(func=cmd_count)

    top = commands.add_parser("top", help="the most common words")
    top.add_argument("files", nargs="+", metavar="FILE")
    top.add_argument("-n", "--number", type=int, default=3, help="how many (default: %(default)s)")
    top.set_defaults(func=cmd_top)
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING,
                        format="%(name)s: %(message)s")
    logger.info("running %s on %d file(s)", args.command, len(args.files))
    try:
        return args.func(args)
    except OSError as error:
        logger.error("%s", error)
        return 1


if __name__ == "__main__":
    sys.exit(main())
```

(`collections.Counter` is a dictionary that counts: `update` adds one for each item, and
`most_common(n)` returns the `n` largest counts.) `argparse` builds the help from the
definitions:

```console
$ python textstat.py top --help
usage: textstat top [-h] [-n NUMBER] FILE [FILE ...]

positional arguments:
  FILE

options:
  -h, --help           show this help message and exit
  -n, --number NUMBER  how many (default: 3)
```

## Arguments, options, types and defaults

- A name without dashes, such as `"files"`, is a **positional** argument: required, identified by
  its place. `nargs="+"` collects one or more into a list; `"*"` allows none, `"?"` makes one
  optional.
- A name with dashes, `"-n", "--number"`, is an **option**. It is optional, and missing options get
  their `default` (otherwise `None`). The attribute name comes from the long form: `args.number`.
- `type=int` converts the text and turns a `ValueError` into a clean error message. Any function
  that takes one string works as a type, including your own.
- `choices=["csv", "json"]` restricts the value to a list.
- `action="store_true"` makes a flag with no value, `False` unless given. `action="count"` counts
  repeats, so `-vvv` gives 3.
- `parse_args(argv)` parses the list you give it, or `sys.argv[1:]` when `argv` is `None`. That is
  why `main(argv=None)` is easy to test: call `main(["top", "-n", "2", "notes.txt"])` directly.

## Subcommands

Tools like `git` and `pip` have **subcommands**, each with its own arguments. `add_subparsers`
creates them; `required=True` makes one mandatory, and `dest="command"` stores which one was
chosen. `set_defaults(func=cmd_top)` attaches a function to each, so `main` simply calls
`args.func(args)`.

## Streams: stdin, stdout and stderr

Results go to stdout with `print`. Messages about the run go to stderr: the logging setup in `main`
writes there, as lesson 3 showed. The convention that a file name of `-` means standard input lets
the tool sit in a **pipeline**, reading what the previous command wrote:

```console
$ python textstat.py count notes.txt
3	8	notes.txt
$ printf "one two\nthree\n" | python textstat.py count notes.txt -
3	8	notes.txt
2	3	-
$ python textstat.py top -n 2 notes.txt
3	the
1	cat
$ python textstat.py count notes.txt > counts.tsv 2> errors.log
```

The last command stores results and messages in separate files, which only works because the
program never mixes them. To print an error yourself, write `print(message, file=sys.stderr)`.

## Exit status

Unix programs generally exit with 2 for a command-line usage error and 1 for any other failure.
`argparse` already exits with 2 when the arguments are wrong:

```console
$ python textstat.py top -n two notes.txt
usage: textstat top [-h] [-n NUMBER] FILE [FILE ...]
textstat top: error: argument -n/--number: invalid int value: 'two'
$ echo $?
2
$ python textstat.py tops notes.txt
usage: textstat [-h] [-v] {count,top} ...
textstat: error: argument command: invalid choice: 'tops', maybe you meant 'top'? (choose from 'count', 'top')
$ python textstat.py -v count notes.txt missing.txt
textstat: running count on 2 file(s)
3	8	notes.txt
textstat: [Errno 2] No such file or directory: 'missing.txt'
$ echo $?
1
```

(`$?` holds the last exit status in a POSIX shell; in PowerShell it is `$LASTEXITCODE`.) The
"maybe you meant" suggestion is on by default from Python 3.15.

`sys.exit(status)` ends the program by raising `SystemExit`, so `finally` blocks still run. An
integer becomes the status, `None` means 0, and a string is printed to stderr with status 1.
Keep the decisions in `main`, which *returns* a status, and call `sys.exit(main())` once at the
bottom. That is also exactly how the console-script wrapper from lesson 1 calls it.

## Behaving well in pipelines

- **Never prompt** with `input()` when the data could come from a pipe. Take everything from
  arguments, files or stdin.
- **Keep stdout plain**: one record per line, tab or comma separated, no decoration, so `sort`,
  `grep` and other programs can read it.
- **Handle a closed pipe.** `python textstat.py top big.txt | head -n 1` makes `head` exit early,
  and the next `print` raises `BrokenPipeError: [Errno 32] Broken pipe`. The `signal` module's
  documentation gives the fix: catch `BrokenPipeError` around the output, point stdout at
  `os.devnull`, and exit with 1.
- **Ctrl+C** raises `KeyboardInterrupt`. Left uncaught, it prints a traceback and the shell sees
  status 130. Catch it in `main` only if you have something to clean up or a short message to
  print.

## Common mistakes

- **Errors on stdout.** `print("error: no such file")` ends up in `counts.tsv`. Log or print errors
  to stderr.
- **Exit status 0 on failure.** A `main` that logs an error and returns nothing exits 0, and the
  CI job goes green. Return 1.
- **`sys.exit(True)`.** `True` is the integer 1, so this exits with status 1. Return integers.
- **Parsing `sys.argv` by hand.** `int(sys.argv[2])` fails with `IndexError` or `ValueError` and
  a traceback instead of a usage message. Use `argparse`.
- **Reading `sys.argv` inside `main`.** Then tests cannot pass arguments in. Accept `argv=None` and
  pass it to `parse_args`.

## Practice

1. Add `--format` to `top`, accepting only `tsv` or `csv`, default `tsv`.
2. What does `main(["count"])` do, and what status does the process end with?
3. Make `-v` repeatable: `-v` for `INFO`, `-vv` for `DEBUG`.

### Answers

1. `top.add_argument("--format", choices=["tsv", "csv"], default="tsv")`, then
   `sep = "," if args.format == "csv" else "\t"` when printing.
2. `count` needs at least one `FILE`, so argparse prints the usage and
   `textstat count: error: the following arguments are required: FILE` to stderr and raises
   `SystemExit(2)`. In a test, catch it with `assertRaises(SystemExit)`.
3. `parser.add_argument("-v", "--verbose", action="count", default=0)` and
   `level = [logging.WARNING, logging.INFO, logging.DEBUG][min(args.verbose, 2)]`.

## Key takeaways

- A CLI's interface is its arguments, stdin, stdout, stderr and exit status.
- `argparse` gives types, choices, defaults, help, subcommands and usage errors with status 2.
- Results to stdout, messages to stderr, `-` for stdin: the tool then works in pipelines.
- Write `main(argv=None)` that returns a status, and end with `sys.exit(main())`.

## Further reading

- [argparse: Parser for command-line options](https://docs.python.org/3.15/library/argparse.html)
- [Argparse tutorial](https://docs.python.org/3.15/howto/argparse.html)
- [sys.exit and sys.argv](https://docs.python.org/3.15/library/sys.html#sys.exit)
- [signal: Note on SIGPIPE](https://docs.python.org/3.15/library/signal.html#note-on-sigpipe)
