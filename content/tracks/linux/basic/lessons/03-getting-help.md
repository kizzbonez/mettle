---
title: Getting Help
summary: Find out what any command does from the system itself, with type, help, --help, man pages and their sections, whatis and apropos, and read a synopsis line correctly.
minutes: 20
objectives:
  - Use `type` to tell a shell builtin from a program file, and pick the right help for each
  - Open a manual page from a given section and move around and search in it
  - Read a synopsis line and say which parts are required, optional and repeatable
  - Find a command you do not know the name of with `apropos`
---

## Outline

1. Where help comes from
2. Builtin or program: `type`
3. `help` for builtins
4. `--help` for programs
5. Manual pages and their sections
6. Moving around a manual page
7. Reading a synopsis
8. Searching the manuals: `whatis` and `apropos`

## Where help comes from

Nobody remembers every option of every command. Professionals look things up constantly, and
the fastest place to look is the machine in front of you, because its documentation matches the
versions installed on it. There are three levels of help:

- `--help`: a short summary that most programs print and exit;
- `help`: the shell's own documentation for the commands built into Bash;
- `man`: the full **manual pages**, the reference for nearly every command and file.

## Builtin or program: `type`

Some commands are **builtins**: they are part of Bash itself, usually because they change the
shell's own state (`cd` changes the shell's working directory) or because they are used so
often. Most commands are separate **program files** stored in directories such as `/usr/bin`.
`type` tells you which kind a name is:

```bash
type cd echo date
type -a echo
```

```text
cd is a shell builtin
echo is a shell builtin
date is /usr/bin/date
echo is a shell builtin
echo is /usr/bin/echo
echo is /bin/echo
```

`-a` lists every match, in the order Bash would try them. `echo` exists both as a builtin and as
a program file; the builtin wins. `type` may also answer that a name is an *alias* (a
shortcut defined in the shell, covered in lesson 13) or a *keyword* such as `if`.

## `help` for builtins

Builtins have no program file, so `help NAME` documents them:

```bash
help pwd
```

```text
pwd: pwd [-LP]
    Print the name of the current working directory.
    
    Options:
      -L	print the value of $PWD if it names the current working
    		directory
      -P	print the physical directory, without any symbolic links
    
    By default, `pwd' behaves as if `-L' were specified.
    
    Exit Status:
    Returns 0 unless an invalid option is given or the current directory
    cannot be read.
```

`help` with no argument lists every builtin.

## `--help` for programs

Most programs accept `--help`. The first line, starting `Usage:`, is the most useful:

```bash
mkdir --help
```

```text
Usage: mkdir [OPTION]... DIRECTORY...
Create the DIRECTORY(ies), if they do not already exist.

Mandatory arguments to long options are mandatory for short options too.
  -m, --mode=MODE   set file mode (as in chmod), not a=rwx - umask
  -p, --parents     no error if existing, make parent directories as needed,
                    with their file modes unaffected by any -m option.
  -v, --verbose     print a message for each created directory
```

(The output continues with a few more options.) Each option is listed in its short and long
forms. "Mandatory arguments to long options are mandatory for short options too" means that
because `--mode=MODE` needs a value, so does `-m`, written `-m MODE`.

## Manual pages and their sections

`man mkdir` opens the manual page for `mkdir`. Every page has the same headings: **NAME** (one
line), **SYNOPSIS** (how to call it), **DESCRIPTION** with the options, and often **EXIT
STATUS**, **EXAMPLES** and **SEE ALSO**, which points to related pages.

```text
MKDIR(1)                         User Commands                        MKDIR(1)

NAME
       mkdir - make directories

SYNOPSIS
       mkdir [OPTION]... DIRECTORY...
```

The `(1)` is the **section**. The manual is divided by subject:

| Section | Contents |
| --- | --- |
| 1 | Commands any user can run |
| 5 | File formats, such as `/etc/passwd` |
| 8 | System administration commands, usually for root |

Sections 2 and 3 document programming interfaces, 4 special device files, 6 games and 7
overviews and conventions. One name can exist in several sections: `passwd` is both a
command and a file. `man passwd` shows the first match, section 1; to read about the file, put
the section number first: `man 5 passwd`. In writing, `passwd(5)` means "the page `passwd` in
section 5".

## Moving around a manual page

`man` displays the page in a **pager**, a program that shows text one screen at a time; on
most systems that pager is `less`. The keys are worth memorising, because `less` is also how
you read long files (lesson 6):

| Key | Action |
| --- | --- |
| Space / `b` | One screen forward / back |
| `j` or Enter / `k` | One line forward / back |
| `g` / `G` | Start / end of the page |
| `/word` then Enter | Search forward for `word` |
| `n` / `N` | Next / previous match |
| `h` | Help on all the keys |
| `q` | Quit |

Searching is the fastest way to find an option: `/-r` jumps to the line describing `-r`.

## Reading a synopsis

A synopsis line is a compact grammar. In `mkdir [OPTION]... DIRECTORY...`:

- words in square brackets are **optional**: you may give no options;
- `...` means **may be repeated**: several options, several directories;
- words not in brackets are **required**: at least one `DIRECTORY`;
- capitals (or underlined or italic text, on a terminal) are **placeholders** that you replace;
  plain lower-case words, such as the command name, are typed exactly.

A vertical bar separates choices, so `-a|-b` means one or the other, not both. The `date`
synopsis from lesson 2, `date [OPTION]... [+FORMAT]`, says that the format is optional and must
start with `+`.

## Searching the manuals: `whatis` and `apropos`

`whatis NAME` prints the one-line NAME description from every section (`man -f` does the same).
`apropos WORD` searches the names and descriptions of all pages for a word, which finds a
command when you do not know its name (`man -k` does the same).

```bash
whatis passwd
apropos rename
whatis nonsense
```

```text
passwd (1)           - change user password
passwd (5)           - the password file
mv (1)               - move (rename) files
rename.ul (1)        - rename files
nonsense: nothing appropriate.
```

Both search an index built by a program called `mandb`. On a fresh system, or in a minimal
container where documentation was left out, they may find nothing; that does not mean the
command is missing. Beyond the man pages, many packages keep extra documentation in
`/usr/share/doc`, and the GNU tools have longer manuals, readable with `info` or online.

## Common mistakes

- **Running `man cd`.** `cd` is a builtin, so there may be no page, or a general one about all
  builtins. Use `help cd`, and `type` when unsure.
- **Reading the whole page from the top.** Search for the option with `/` instead.
- **Typing the brackets.** `[OPTION]` in a synopsis means "optionally, an option"; you type
  the option, not the brackets.
- **Confusing sections.** `man passwd` describes the command; the format of the file
  `/etc/passwd` is in `man 5 passwd`.
- **Trusting a random web page first.** Options differ between versions and between Linux and
  macOS. The local manual describes the program you actually have.

## Practice

1. Is `history` a builtin or a program file, and which help command documents it?
2. What does this synopsis allow, and what does it forbid?
   `cp [OPTION]... SOURCE... DIRECTORY`
3. You need a command that "counts words" but do not know its name. What do you type?

### Answers

**1.** `type history` answers `history is a shell builtin`, so `help history` documents it.

**2.** Any number of options (including none), then one or more sources, then exactly one
directory at the end. It forbids leaving out the sources or the directory.

**3.** `apropos word` (or `man -k word`) lists every page whose name or description mentions
"word"; the list includes `wc (1) - print newline, word, and byte counts for each file`.

## Key takeaways

- `type NAME` tells a builtin from a program; builtins use `help`, programs `--help` and `man`.
- Manual sections: 1 for commands, 5 for file formats, 8 for administration.
- In a synopsis, `[ ]` is optional, `...` is repeatable and capitals are placeholders.
- `apropos` finds commands by topic; `whatis` gives the one-line summary.

## Further reading

- [man(1): the manual pager, including sections and synopsis conventions](https://man7.org/linux/man-pages/man1/man.1.html)
- [apropos(1)](https://man7.org/linux/man-pages/man1/apropos.1.html)
- [less(1)](https://man7.org/linux/man-pages/man1/less.1.html)
