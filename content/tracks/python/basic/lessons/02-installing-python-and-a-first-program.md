---
title: Installing Python and a First Program
summary: Install Python 3.15 on Windows, macOS or Linux from python.org, check the version, use the interactive shell, then write and run a first script with print and comments, learn why indentation matters, and read your first tracebacks.
minutes: 30
objectives:
  - Install Python 3.15 on your operating system and check which version runs
  - Start and leave the interactive shell, and run a .py file from a terminal
  - Write a script with print calls and comments
  - Explain why indentation is part of Python's syntax
  - Read a traceback and fix a SyntaxError, an IndentationError and a NameError
---

## Outline

1. A terminal and an editor
2. Installing on Windows
3. Installing on macOS
4. Installing on Linux
5. Checking the version and using the shell
6. A first script
7. Indentation is syntax
8. Reading a traceback

## A terminal and an editor

You need two tools. A **terminal** (also called the command line) is a window where you type
commands: Windows Terminal or PowerShell on Windows, Terminal on macOS, and the terminal of your
Linux desktop. An **editor** is where you write `.py` files. Any plain-text editor works. IDLE,
the small editor included with Python from python.org (start it with `python -m idlelib`; on
Linux you may need your distribution's `idle` package), is enough for this course; Visual Studio
Code is a popular free alternative. A word processor such as Word is not an editor: it saves formatting
that Python cannot read.

In this course, a line starting with `$` or `PS>` is a command you type in a terminal (without
the `$`), and a line starting with `>>>` is typed into Python's interactive shell.

## Installing on Windows

From Python 3.14 on, the recommended way is the **Python install manager**. Install it from the
Microsoft Store (search for "Python install manager") or download it from
[python.org/downloads](https://www.python.org/downloads/); both are the same program. It gives you
three commands: `python`, `py` and `pymanager`. Then install 3.15 and check:

```console
PS> py install 3.15
PS> py list
PS> python --version
Python 3.15.0
```

`py install 3.15` downloads and installs that version, and `py list` shows the versions you have.
If none is installed yet, simply typing `python` installs the latest release for you. With
several versions installed, `py -V:3.15 hello.py` picks one. The old full `.exe` installer still
exists for 3.15 but is deprecated and will not be made for 3.16. If typing `python` opens the
Store or says the command is not found, search the Start menu for **Manage app execution
aliases** and make sure the Python entries are switched on.

## Installing on macOS

Download the macOS installer (a `.pkg` file) from
[python.org/downloads/macos](https://www.python.org/downloads/macos/), double-click it and follow
the steps; you need an administrator account. It creates a folder `/Applications/Python 3.15`
with IDLE in it. Double-click **Install Certificates.command** in that folder once, so Python can
make secure web connections. Then, in Terminal:

```console
$ python3 --version
Python 3.15.0
```

On macOS the command is `python3`, not `python`. Your Mac may already have a `/usr/bin/python3`
that belongs to Apple's developer tools; it is older, so leave it alone and let the python.org
version, which the installer puts first on your path, do the work.

## Installing on Linux

Python comes preinstalled on most Linux distributions, and the command is `python3`. Check its
version with `python3 --version`. Your distribution's package may be older than 3.15. You can
install its current Python with the package manager, for example `sudo apt install python3` on
Debian and Ubuntu or `sudo dnf install python3` on Fedora. To get 3.15 itself when your
distribution does not offer it yet, build it from the source code on python.org with
`./configure`, `make` and then `make altinstall`, which installs it as `python3.15` without
replacing the system's `python3`.

From here on the course writes `python`. On macOS and Linux, type `python3` instead.

## Checking the version and using the shell

Type `python` with nothing after it to start the **interactive shell**. It prints the version,
then waits at the `>>>` prompt:

```text
Python 3.15.0 (main, Oct 12 2026, 22:33:31) [GCC 14.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> 2 + 3
5
>>> print("Hello")
Hello
```

Your first line shows your own system and date. Since Python 3.13 the shell has colours and
multi-line editing, and understands `exit` and `quit` without brackets. You can also leave with Ctrl+D (macOS, Linux) or Ctrl+Z then Enter (Windows).

## A first script

Make a folder for the course, create `hello.py` in it with your editor, and type:

```python
# hello.py: my first Python program
print("Hello, world!")
print("Python is running this file.")  # a comment can follow code
print()
print("Bye.")
```

In a terminal, move into that folder with `cd` and run it:

```console
$ python hello.py
Hello, world!
Python is running this file.

Bye.
```

- `print(...)` writes what is between the brackets, then moves to a new line. `print()` with
  nothing inside prints an empty line.
- Text in quotes, such as `"Hello, world!"`, is a **string** (lesson 5). The quotes mark where it
  starts and ends; they are not printed.
- A **comment** starts with `#` and runs to the end of the line. Python ignores it. Comments are
  notes for people: say *why* the code does something, not what it obviously does.
- Python runs the lines from top to bottom, one statement per line.

## Indentation is syntax

Many languages use braces `{ }` to group lines. Python uses **indentation**, the spaces at the
start of a line. Lines that belong together, such as the body of an `if` (lesson 7), are indented
by the same amount, and PEP 8, Python's style guide, says to use four spaces. So indentation is
not decoration: an extra space where none belongs is an error.

```python
print("one")
    print("two")
```

```text
  File "/tmp/indent.py", line 2
    print("two")
IndentationError: unexpected indent
```

The opposite mistake, a block that should be indented and is not, gives
`IndentationError: expected an indented block after 'if' statement on line 1`. Set your editor
to insert four spaces when you press Tab, and never mix tabs and spaces.

## Reading a traceback

When Python stops on an error it prints a **traceback**. Read it from the **bottom up**: the last
line names the kind of error and explains it, and the lines above say where it happened.

```python
print("Starting")
print(Hello)
```

```text
Starting
Traceback (most recent call last):
  File "/tmp/noquotes.py", line 2, in <module>
    print(Hello)
          ^^^^^
NameError: name 'Hello' is not defined
```

- **Last line**: a `NameError`, so Python met a name it does not know. Without quotes, `Hello` is
  not text but a name, and nothing called `Hello` exists. The fix is `print("Hello")`.
- **`File ..., line 2`**: the file and line. `<module>` means the top level of the file. The path
  is wherever your file is.
- The **carets** `^^^^^` underline the exact part that failed.

`Starting` was printed, so this error happened while running. A `SyntaxError` or
`IndentationError`, by contrast, is found before anything runs, and its report has no
"Traceback" heading. Forgetting a closing quote gives
`SyntaxError: unterminated string literal (detected at line 1)`.

## Common mistakes

- **Typing `python hello.py` inside the shell.** It is a `SyntaxError`; that command belongs in
  the terminal. Leave the shell first.
- **Running a file from the wrong folder.** `python: can't open file ... [Errno 2] No such file or
  directory` means the terminal is in another folder. Use `cd` to move to where the file is.
- **Capital letters.** Python is case-sensitive: `Print("Hi")` gives
  `NameError: name 'Print' is not defined. Did you mean: 'print'?`
- **Curly quotes.** Text pasted from a word processor may contain `“ ”`:
  `SyntaxError: invalid character '“' (U+201C)`. Use the plain `"` key.

## Practice

1. Write a script that prints your name on one line, an empty line, and then `Done.`
2. This script fails. What is the error, and how do you fix it?

   ```python
   print("Ready")
     print("Steady")
   ```

3. What error does `print(Go)` give, and why?

### Answers

1. ```python
   print("Grace Hopper")
   print()
   print("Done.")
   ```

   `print()` with nothing inside prints an empty line.
2. `IndentationError: unexpected indent` on line 2. The second line is indented although no block
   started. Remove the spaces so both lines start in the first column.
3. `NameError: name 'Go' is not defined`. Without quotes, `Go` is a name, and no such name exists.
   Write `print("Go")` to print the text.

## Key takeaways

- On Windows, install Python with the Python install manager (`py install 3.15`); on macOS, use the
  python.org installer; on Linux, use your distribution's `python3` or build 3.15 from source.
- `python --version` (or `python3 --version`) tells you which Python runs.
- `python` alone opens the interactive shell; `python hello.py` runs a script.
- `print` writes a line; `#` starts a comment.
- Indentation groups lines, so stray or missing indentation is an error.
- Read a traceback from the bottom: error type and message, then file, line and carets.

## Further reading

- [Using Python on Windows: the Python install manager](https://docs.python.org/3.15/using/windows.html)
- [Using Python on macOS](https://docs.python.org/3.15/using/mac.html)
- [Using Python on Unix platforms](https://docs.python.org/3.15/using/unix.html)
- [Python tutorial: Using the Python interpreter](https://docs.python.org/3.15/tutorial/interpreter.html)
