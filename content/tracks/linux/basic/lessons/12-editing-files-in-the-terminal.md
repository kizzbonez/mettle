---
title: Editing Files in the Terminal
summary: Edit configuration files and notes without a desktop, with nano for everyday changes and vi well enough to insert text, search, save and quit, and set the editor other programs open.
minutes: 30
objectives:
  - Open, change, save and leave a file in `nano` using the keys on its help lines
  - Explain vi's modes and switch between them with `i`, `a`, `o` and Esc
  - Search, delete, copy, paste and undo in vi, and save or abandon changes with `:w`, `:wq`, `:q!` and `ZZ`
  - Choose the editor other programs start through the `EDITOR` variable
---

## Outline

1. Why a terminal editor
2. `nano`: the screen
3. Editing and saving in `nano`
4. vi: modes
5. Moving and searching in vi
6. Changing text in vi
7. Saving and quitting vi
8. Other editors, and choosing one

## Why a terminal editor

Sooner or later you will need to change a file on a machine with no desktop: a configuration
file on a server, a script in a container. Commands such as `echo >>` can append a line, but
real changes need a **text editor** that runs inside the terminal. Two are worth knowing:

- **nano**: simple, with its keys always on screen; installed on most distributions.
- **vi**: on virtually every Unix-like system, including minimal ones where nothing else is
  installed. Most Linux systems provide it as **Vim** ("Vi IMproved"), which accepts all the vi
  commands taught here.

Editors work on a copy of the file in memory, called the **buffer**. Nothing reaches the disk
until you save.

## `nano`: the screen

`nano FILE` opens a file, or starts an empty buffer for a new one that is created when you
save. The screen looks like this (nano 7.2 on Debian):

```bash
nano app.conf
```

```text
  GNU nano 7.2                        app.conf
port=8080
host=example.org

                              [ Read 2 lines ]
^G Help      ^O Write Out ^W Where Is  ^K Cut       ^T Execute   ^C Location
^X Exit      ^R Read File ^\ Replace   ^U Paste     ^J Justify   ^/ Go To Line
```

The two **help lines** at the bottom list the main commands. `^` means **Ctrl**, so `^X` is
Ctrl+X. `M-` means **Alt** (the *Meta* key), so `M-U` is Alt+U. The line above them is the
**status bar**, where nano reports what happened and asks its questions.

## Editing and saving in `nano`

Typing inserts text at the cursor; the arrow keys move it and Backspace deletes. The keys you
need every day:

| Keys | Action |
| --- | --- |
| Ctrl+O, then Enter | Write Out: save, confirming the file name |
| Ctrl+X | Exit; if there are unsaved changes, nano asks first |
| Ctrl+W, text, Enter | Where Is: search; Alt+W finds the next match |
| Ctrl+K / Ctrl+U | Cut the current line / paste it at the cursor |
| Alt+U / Alt+E | Undo / redo |
| Ctrl+G | Help with every command |

Leaving with unsaved changes looks like this on the status bar:

```text
Save modified buffer?
 Y Yes
 N No           ^C Cancel
```

`Y` asks `File Name to Write: app.conf`; Enter accepts the name, and nano reports
`[ Wrote 3 lines ]` and exits. `N` throws the changes away, and Ctrl+C returns to editing.
`nano +12 FILE` opens the file with the cursor on line 12, which is useful when an error
message names a line number.

Keys can change between versions, so if one of these does nothing, the help lines and Ctrl+G
show the right one for yours.

## vi: modes

vi is different from every editor you have used, because it has **modes**:

- **Normal mode** (vi's documentation calls it *command mode*): where vi starts. Keys are
  **commands**, not text: `x` deletes a character, `dd` a line.
- **Insert mode**: keys type text, as in nano. Many versions show `-- INSERT --` at the bottom.
- **Command-line mode**: a `:` in normal mode opens a prompt at the bottom for commands such as
  `:w` (write).

| Key in normal mode | Enters insert mode... |
| --- | --- |
| `i` | before the cursor |
| `a` | after the cursor |
| `o` | on a new line below the current one |

**Esc** always returns to normal mode. If you are unsure which mode you are in, press Esc.
Opening the same file in vi shows the text, a `~` on each line past the end of the file, and a
status line at the bottom:

```bash
vi app.conf
```

```text
port=8080
host=example.org
~
~
~
"app.conf" 2 lines, 27 bytes
```
The classic beginner experience, typing a sentence and watching vi do strange things, is
simply typing in normal mode.

## Moving and searching in vi

The arrow keys work in most versions. The original keys, still used by experts because they
are under your fingers, are `h` (left), `j` (down), `k` (up) and `l` (right). Also:

| Keys | Moves to |
| --- | --- |
| `0` / `$` | Start / end of the line |
| `1G` (or `gg` in Vim) / `G` | First / last line |
| `/text`, Enter | Next occurrence of `text` |
| `?text`, Enter | Previous occurrence of `text` |
| `n` / `N` | Next / previous match, repeating the search |

## Changing text in vi

| Keys | Action |
| --- | --- |
| `x` | Delete the character under the cursor |
| `dd` | Delete (cut) the current line |
| `yy` | Copy ("yank") the current line |
| `p` | Paste below the current line |
| `u` | Undo the last change |

A complete edit of `app.conf`, changing the port to 9090 and adding a line at the end, as
keys typed in order:

```text
/8080 Enter        search: the cursor lands on the 8 of 8080
x x x x            delete the four digits
a 9090 Esc         append after the cursor, then back to normal mode
G                  go to the last line
o debug=false Esc  open a new line below, type, back to normal mode
:wq Enter          write the file and quit
```

```bash
cat app.conf
```

```text
port=9090
host=example.org
debug=false
```

(After the last `x` the cursor sits on the `=`, which is why the text is *appended* with `a`;
`i` would have inserted before the `=`.)

## Saving and quitting vi

| Command | Effect |
| --- | --- |
| `:w` Enter | Write (save) and keep editing |
| `:wq` Enter, or `ZZ` | Write and quit (`ZZ` writes only if something changed) |
| `:q` Enter | Quit, refused if there are unsaved changes |
| `:q!` Enter | Quit and **discard** the changes |
| `:w!` Enter | Write even where vi would normally refuse |

When you try `:q` with unsaved changes, Vim answers on the bottom line:

```text
E37: No write since last change (add ! to override)
```

It is protecting your work. Decide: `:wq` to keep the changes, `:q!` to abandon them. That is
the whole answer to the famous question "how do I get out of vi?": Esc, then `:q!` and Enter.

## Other editors, and choosing one

Vim adds many features to vi; Emacs is another powerful editor with its own long tradition.
Programs that need you to edit something, such as `crontab -e` (scheduled jobs) or `git
commit`, start the editor named in the variable **`EDITOR`** (some check `VISUAL` first). When
neither is set, many fall back to a system default; on this Debian machine that is `editor`, a
link to nano. To choose vi for the rest of the session:

```bash
export EDITOR=vi
echo $EDITOR
```

```text
vi
```

Lesson 13 explains `export` and how to make such a setting permanent.

## Common mistakes

- **Typing in vi's normal mode.** Press Esc, then `i`, then type.
- **Forgetting to save.** Changes live in the buffer until you write them out.
- **Leaving with `:q!` when you meant `:wq`.** `!` means "discard".
- **Searching for text with special characters.** In vi, `/` takes a regular expression, so
  `.` matches any character, as in `grep`.
- **Editing system files as an ordinary user.** Files in `/etc` are owned by root; saving fails
  with a permission error. Administrators use `sudoedit FILE` or `sudo nano FILE`.

## Practice

1. In nano, which keys save the file without leaving, and which leave without saving?
2. You are in vi, typed some text, and want to leave without saving anything. Which keys do you
   press, from whatever mode you are in?
3. In vi, the cursor is on line 2 of a five-line file. Which keys copy that line and paste a copy
   after the last line?

### Answers

**1.** Ctrl+O then Enter saves and stays. Ctrl+X then `N` leaves without saving.

**2.** Esc (to be sure you are in normal mode), then `:q!` and Enter.

**3.** `yy` to copy the line, `G` to go to the last line, `p` to paste below it.

## Key takeaways

- nano shows its keys on screen: Ctrl+O saves, Ctrl+X exits, Ctrl+W searches.
- vi starts in normal mode; `i`, `a` and `o` enter insert mode; Esc goes back.
- `/text` and `n` search; `x`, `dd`, `yy`, `p` and `u` edit; `:w`, `:wq`, `ZZ` and `:q!` save
  or leave.
- `EDITOR` chooses the editor other programs open.

## Further reading

- [GNU nano manual](https://www.nano-editor.org/dist/latest/nano.html)
- [POSIX vi specification (The Open Group)](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/vi.html)
- [nano(1) on Debian 12](https://manpages.debian.org/bookworm/nano/nano.1.en.html)
