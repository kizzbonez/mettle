---
title: Regular Expressions with grep
summary: Describe the text you are looking for with basic and extended regular expressions, and search files and whole directory trees with grep's most useful options.
minutes: 30
objectives:
  - Build regular expressions from literals, the dot, anchors, bracket expressions and repetition
  - Explain the difference between basic and extended regular expressions and write both
  - Choose among `grep -E`, `-i`, `-v`, `-c`, `-o`, `-w`, `-n`, `-l` and `-r` for a search task
  - Quote a regular expression so the shell passes it to `grep` unchanged
---

## Outline

1. What a regular expression is
2. Literals and the dot
3. Anchors
4. Bracket expressions
5. Repetition
6. Basic and extended syntax
7. Alternation and groups
8. Options you will use every day

## What a regular expression is

A **regular expression** (regex for short) is a pattern that describes a set of strings: "a line
that starts with `#`", "three digits, a hyphen, four digits". `grep` prints every line that
contains a match for the pattern somewhere in it. The same patterns drive `sed` and `awk` in the
next two lessons, so time spent here pays off three times.

Regular expressions look a little like the wildcards of the Basic level, but they are a different
language: in a wildcard `*` means "anything", while in a regex it means "the previous item, any
number of times". Always put a regex in **single quotes**. Many regex characters, such as `*`,
`?`, `[` and `$`, are special to the shell too, and single quotes stop the shell from touching
them before `grep` sees them.

The examples search this file, `app.conf`:

```text
# Server settings
port=8080
host = example.org

#debug=true
color=blue
colour=green
timeout=30s
retries=3
```

## Literals and the dot

Most characters are **literals**: they match themselves, so `port` matches the four letters
`port`. The **dot** `.` matches any one character. To match a real dot, escape it with a
backslash, `\.`, or switch off regular expressions altogether with `grep -F`, which treats the
pattern as fixed text.

```bash
printf 'v1.2\nv1x2\n' | grep 'v1.2'
printf 'v1.2\nv1x2\n' | grep 'v1\.2'
```

```text
v1.2
v1x2
v1.2
```

## Anchors

An **anchor** matches a position rather than a character. `^` is the start of the line and `$`
is the end, so `^#` finds comment lines and `^$` finds empty lines. `\<` and `\>` mark the start
and end of a word. Combined with `-v`, which prints the lines that do **not** match, anchors strip
a configuration file down to its real settings:

```bash
grep -v '^#' app.conf | grep -v '^$'
```

```text
port=8080
host = example.org
color=blue
colour=green
timeout=30s
retries=3
```

## Bracket expressions

A **bracket expression** matches one character from a set: `[aeiou]` is any vowel, `[0-9]` any
digit and `[^0-9]` (with `^` first inside the brackets) any character that is *not* a digit.
Named **character classes** go inside a bracket expression: `[[:digit:]]`, `[[:alpha:]]`,
`[[:alnum:]]` (letters and digits), `[[:space:]]` and `[[:upper:]]`. The doubled brackets are
correct: the outer pair is the bracket expression, `[:digit:]` is the class. Prefer classes to
ranges such as `[a-z]`, whose meaning depends on the locale.

## Repetition

A **quantifier** says how many times the item before it may occur:

| Quantifier | Means |
| --- | --- |
| `*` | zero or more times |
| `+` | one or more times |
| `?` | zero or one time (optional) |
| `{3}` | exactly three times |
| `{2,}` | two or more times |
| `{2,4}` | between two and four times |

So `[0-9]+` is a whole number and `.*` is "anything at all, including nothing".

## Basic and extended syntax

`grep` understands two dialects. **Basic regular expressions** (BRE) are the default. In them,
`?`, `+`, `{`, `|`, `(` and `)` are ordinary characters, and you need a backslash to make them
operators: `\?`, `\+`, `\{3\}`. **Extended regular expressions** (ERE), switched on with `grep -E`,
make them operators without the backslash. The two dialects can match the same things; ERE is
just easier to read. The old commands `egrep` and `fgrep` mean `grep -E` and `grep -F`; GNU grep
has deprecated them since 2007, and recent versions may print a warning, so use the options.

```bash
grep 'colou\?r' app.conf
grep -E 'colou?r' app.conf
grep 'colou?r' app.conf
```

```text
color=blue
colour=green
color=blue
colour=green
```

The third command printed nothing: in BRE, `?` is a literal question mark, and no line contains
`colou?r`.

## Alternation and groups

In ERE, `|` means "either side" and parentheses group items so a quantifier or `|` applies to
the whole group. With `-o`, `grep` prints only the matching part of each line, one match per line.
The next examples use `people.txt`:

```text
Ada Lovelace, 555-0142, ada@example.org
Grace Hopper, 555-0199, grace@example.net
Alan Turing, 5550123, alan(at)example.org
Linus, 555-01, linus@example.com
```

```bash
grep -E '[0-9]{3}-[0-9]{4}' people.txt
grep -oE '[[:alnum:]._]+@[[:alnum:].]+' people.txt
grep -Ev '^(#|$)' app.conf | grep -c '='
```

```text
Ada Lovelace, 555-0142, ada@example.org
Grace Hopper, 555-0199, grace@example.net
ada@example.org
grace@example.net
linus@example.com
6
```

The phone pattern skips `5550123` (no hyphen) and `555-01` (too short). The last line strips
comments and blank lines in one pattern, then counts the settings with `-c`.

## Options you will use every day

| Option | Effect |
| --- | --- |
| `-i` | ignore the difference between upper and lower case |
| `-v` | print the lines that do not match |
| `-c` | print how many lines matched instead of the lines |
| `-o` | print only the matched text |
| `-w` | match whole words only |
| `-n` | put the line number in front of each line |
| `-l` | print only the names of files that contain a match |
| `-r` | search every file under a directory |

For `-w`, a word is made of letters, digits and underscores, so `grep -w cat` finds `the cat sat`
but not `catalog` or `bobcat`. With `-r`, every printed line starts with its file name:

```bash
mkdir -p proj/src proj/docs
printf 'fn main() {}\n// TODO: tests\n' > proj/src/main.rs
printf 'todo list\nTODO: write docs\n' > proj/docs/notes.md
grep -rn 'TODO' proj
grep -rli 'todo' proj
```

```text
proj/docs/notes.md:2:TODO: write docs
proj/src/main.rs:2:// TODO: tests
proj/docs/notes.md
proj/src/main.rs
```

The order of files follows the directory, so yours may differ. `grep` also reports through its
**exit status**, a number every command returns: `0` when a line matched, `1` when none did and
`2` on an error such as a missing file. Lesson 8 uses that to make decisions.

## Common mistakes

- **Forgetting the quotes.** Without them the shell may expand `*` or `[0-9]` as wildcards first.
- **Using `+`, `?` or `|` without `-E`.** In basic syntax they are plain characters, and the
  search silently finds nothing.
- **An unescaped dot.** `1.2` also matches `1x2`; write `1\.2` or use `-F`.
- **Forgetting anchors.** `[0-9]{3}` matches inside `12345`; use `^[0-9]{3}$` for "exactly three".
- **Confusing `^` inside and outside brackets.** `^a` is "starts with a"; `[^a]` is "not a".

## Practice

1. Print the lines of `app.conf` whose value is a plain whole number, such as `port=8080`.
2. Count the lines of `people.txt` that do not contain an `@`.
3. Find every line in `app.conf` that mentions `example`, ignoring case, and show its line number.

### Answers

1. `grep -E '^[a-z]+=[0-9]+$' app.conf` prints `port=8080` and `retries=3`. The `$` anchor rejects
   `timeout=30s`, and `host = example.org` fails because of its spaces.
2. `grep -vc '@' people.txt` prints `1`: only Alan Turing's line lacks one.
3. `grep -in 'example' app.conf` prints `3:host = example.org`.

## Key takeaways

- A regex describes text: literals, `.`, anchors `^ $`, brackets `[ ]` and quantifiers.
- Basic syntax needs backslashes before `? + { | ( )`; `grep -E` does not.
- Single-quote every pattern so the shell leaves it alone.
- `-v`, `-c`, `-o`, `-w`, `-i`, `-n`, `-l` and `-r` turn one pattern into many kinds of answer.

## Further reading

- [GNU grep manual](https://www.gnu.org/software/grep/manual/grep.html)
- [grep(1) manual page](https://man7.org/linux/man-pages/man1/grep.1.html)
- [regex(7): POSIX regular expressions](https://man7.org/linux/man-pages/man7/regex.7.html)
