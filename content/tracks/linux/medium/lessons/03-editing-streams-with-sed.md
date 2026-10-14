---
title: Editing Streams with sed
summary: Change text on its way through a pipeline with sed's substitute command, choose the lines it works on with addresses, and edit files in place without losing data.
minutes: 30
objectives:
  - Replace text with `s/regex/replacement/` and its `g`, number and `I` flags, using `&` and back-references
  - Select lines by number, range and regular expression, and negate a selection with `!`
  - Delete and print chosen lines with `d`, `p` and `-n`
  - Edit a file in place with `-i`, keep a backup, and explain what can go wrong
---

## Outline

1. What sed is
2. Substitution
3. Back-references and other delimiters
4. Addresses: choosing lines
5. Deleting, printing and quitting
6. Editing files in place

## What sed is

`sed`, the **stream editor**, applies editing commands to text as it flows past. It reads one
line into a buffer called the **pattern space**, runs your script on it, prints the result and
moves on to the next line. It never asks questions and never opens a window, which makes it ideal
inside pipelines and scripts: the same edit can be applied to one file or ten thousand.

A sed **script** is one or more commands. Each command is a letter, often preceded by an
**address** that says which lines it applies to. Without an address, a command applies to every
line. Put the script in single quotes for the same reason as a `grep` pattern.

The examples use this `app.conf`:

```text
# Server settings
port=8080
host=example.org

#debug=true
color=blue
timeout=30
```

## Substitution

The command you will use most is `s/regex/replacement/flags`. It finds the **first** match of
the regular expression on each line and replaces it. Flags change that: `g` replaces every match
on the line, a number such as `2` replaces only the second match, and `I` ignores case.

```bash
echo 'one cat, two cats' | sed 's/cat/dog/'
echo 'one cat, two cats' | sed 's/cat/dog/g'
echo 'one cat, two cats' | sed 's/cat/dog/2'
echo 'Cat cat' | sed 's/cat/dog/gI'
```

```text
one dog, two cats
one dog, two dogs
one cat, two dogs
dog dog
```

The regex follows the rules of lesson 2. By default sed uses basic syntax; `sed -E` switches to
extended syntax, so `+`, `?`, `{}`, `|` and `()` work without backslashes.

## Back-references and other delimiters

In the replacement, `&` stands for the whole matched text. Parentheses in the regex
**capture** what they match, and `\1`, `\2` and so on insert those captured parts, in the order
their opening parentheses appear. This lets you rearrange text rather than just replace it.

```bash
echo 'port=8080' | sed 's/[0-9]*$/[&]/'
echo '2026-10-14' | sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\3.\2.\1/'
echo '/usr/local/bin' | sed 's|/usr/local|/opt|'
```

```text
port=[8080]
14.10.2026
/opt/bin
```

The last line shows that the character right after `s` becomes the delimiter. When the text is
full of slashes, as paths are, choosing `|` or `#` saves you from writing `\/` everywhere.

## Addresses: choosing lines

An address in front of a command limits it to certain lines:

| Address | Selects |
| --- | --- |
| `3` | line 3 |
| `$` | the last line |
| `/regex/` | every line that matches |
| `2,5` | lines 2 to 5 |
| `/start/,/end/` | from a line matching `start` to the next line matching `end` |
| `/regex/,+2` | a matching line and the two after it |
| `1~3` | line 1 and every third line after it |
| `addr!` | every line the address does **not** select |

```bash
sed '/^port=/s/8080/9090/' app.conf | head -3
```

```text
# Server settings
port=9090
host=example.org
```

Only lines starting with `port=` were candidates for the substitution, so a `8080` anywhere else
in the file would be left alone. Narrowing an edit this way is the main defence against changing
more than you meant to.

## Deleting, printing and quitting

`d` deletes the pattern space, so the line is not printed. `p` prints it. Because sed already
prints every line automatically, `p` alone shows selected lines twice; the option `-n` turns off
the automatic printing, so `sed -n` with `p` prints only what you choose. `q` quits after the
current line, which makes `sed 10q` behave like `head`. Separate several commands with `;` or
give each one its own `-e`.

```bash
sed -n '2,3p' app.conf
sed -n '$p' app.conf
sed '/^#/d; /^$/d' app.conf
sed -n '/^#/!p' app.conf | head -2
```

```text
port=8080
host=example.org
timeout=30
port=8080
host=example.org
color=blue
timeout=30
port=8080
host=example.org
```

## Editing files in place

Normally sed writes to standard output and leaves the file alone. `-i` edits the file **in
place**: sed writes the result to a temporary file and then renames it over the original. Write
a suffix straight after `-i` and sed keeps the original under that suffix as a backup.

```bash
cp app.conf work.conf
sed -i.bak 's/timeout=30/timeout=60/' work.conf
tail -1 work.conf
tail -1 work.conf.bak
printf 'keep me\nport=1\nkeep me too\n' > danger.conf
sed -n -i 's/port=1/port=2/p' danger.conf
cat danger.conf
```

```text
timeout=60
timeout=30
port=2
```

The last command is the classic accident. With `-n`, only the lines printed by `p` survive, and
`-i` saves exactly that output, so the two `keep me` lines are gone for good. Three more risks
come from the rename:

- There is no undo. Without a backup suffix, a wrong regex has already changed the file.
- A **symbolic link** given to `sed -i` is replaced by an ordinary file holding the new text, and
  the file it pointed to is left unchanged (GNU sed's `--follow-symlinks` edits the target).
- The edited file is a new file, so any **hard link** to the old one keeps the old content.

A safe routine: run the command without `-i` and read the output, then add `-i.bak`, then check
the result with `diff work.conf.bak work.conf` before deleting the backup.

## Common mistakes

- **Expecting `s` to change every match.** Without `g` it changes the first match on each line.
- **Using `+` or `{3}` without `-E`.** In basic syntax they are literal characters.
- **`p` without `-n`.** Every selected line appears twice.
- **`-n` together with `-i`.** The file keeps only the printed lines.
- **Double quotes around a script containing `$`.** The shell expands `$p` or `$1` before sed
  sees it; use single quotes.

## Practice

1. Print `app.conf` with every `=` replaced by ` = ` (a space on each side).
2. Print only the line numbers 2 to 4 of `app.conf`, then do the same with `head` and `tail`.
3. Turn `Lovelace, Ada` into `Ada Lovelace` with one sed command.

### Answers

1. `sed 's/=/ = /' app.conf`. Each line has at most one `=`, so `g` is not needed, but adding it
   does no harm.
2. `sed -n '2,4p' app.conf` and `head -4 app.conf | tail -3` both print `port=8080`,
   `host=example.org` and an empty line.
3. `echo 'Lovelace, Ada' | sed -E 's/([^,]+), (.+)/\2 \1/'`. The first group captures everything
   up to the comma, the second everything after the comma and space.

## Key takeaways

- `s/regex/replacement/` changes the first match per line; `g`, a number or `I` change that.
- `&` is the whole match and `\1` to `\9` the captured groups; any character can be the delimiter.
- Addresses (numbers, `$`, `/regex/`, ranges, `!`) decide which lines a command touches.
- `-i` overwrites the file: preview first, keep a backup suffix and never combine it with `-n`
  carelessly.

## Further reading

- [GNU sed manual](https://www.gnu.org/software/sed/manual/sed.html)
- [sed(1) manual page](https://man7.org/linux/man-pages/man1/sed.1.html)
