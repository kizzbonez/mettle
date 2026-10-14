---
title: What Python Is and How It Runs
summary: What a program, a programming language and an interpreter are, how CPython turns a .py file into bytecode and runs it, the interactive shell versus scripts, the difference between lexis, syntax and semantics, and why this course uses Python 3.15.
minutes: 25
objectives:
  - Explain what a program, source code, a compiler and an interpreter are
  - Describe the steps CPython takes from a .py file to running bytecode on its virtual machine
  - Tell the interactive shell from a script and say what each shows you
  - Classify an error as a problem of lexis, syntax or semantics
  - Say which Python version is current, how long it is supported, and where Python is used
---

## Outline

1. Programs and programming languages
2. Compilers and interpreters
3. How CPython runs your code
4. The interactive shell and scripts
5. Lexis, syntax and semantics
6. Where Python is used
7. Versions, and why this course uses 3.15

## Programs and programming languages

A computer's processor understands only **machine code**: long sequences of numbers, each one a
tiny instruction such as "add these two values" or "jump to that place". A **program** is a list
of instructions that together do a job, such as adding up a shopping list or serving a web page.

Instead of machine code we write in a **programming language**: a set of words and rules precise
enough for a tool to translate into machine code, yet readable by people. The text you write is called **source code**. Python source code is plain text kept in
files whose names end in `.py`.

Here is a complete Python program of two lines, saved as `hello.py`:

```python
name = "Ada"
print("Hello,", name)
```

```text
Hello, Ada
```

Line 1 stores the text `"Ada"` under the name `name`. A name that refers to a value is a
**variable** (lesson 3). Line 2 calls `print`, a **function**: a named piece of code that does
one job, here writing text to the screen. Each line is one **instruction**, which Python calls a
**statement**. Python runs statements from top to bottom.

## Compilers and interpreters

There are two classic ways to turn source code into something a processor can run.

- A **compiler** translates the whole program into machine code before it runs and saves the
  result as an executable file. C, C++ and Rust work this way. The program runs fast, but every
  change means compiling again.
- An **interpreter** is a program that reads your source code and carries out its instructions
  itself, as it goes. You edit and run at once, and the same source runs on any computer that
  has the interpreter. The price is speed: interpreted programs are usually slower.

Python is called an **interpreted language**. The official glossary adds that "the distinction
can be blurry because of the presence of the bytecode compiler", which the next section explains.

## How CPython runs your code

The interpreter you download from python.org is **CPython**, written in the C language. It is the
reference implementation: new features appear there first. Others exist, such as PyPy (with a
just-in-time compiler) and Jython (Python on Java), but this course uses CPython.

When you run `python hello.py`, CPython does four things:

1. **Reads** the file as text, decoding it as UTF-8.
2. **Splits** the text into **tokens**, the smallest meaningful pieces: names like `print`,
   literals like `"Ada"`, operators like `=`.
3. **Parses** the tokens, checking that they follow Python's grammar, and **compiles** them into
   **bytecode**: simple instructions for an imaginary computer.
4. **Executes** the bytecode on the **Python virtual machine**, a loop inside CPython that runs
   one bytecode instruction after another.

You never have to look at bytecode, but you can. The `dis` (disassembler) tool prints it:

```console
$ python -m dis hello.py
  0           RESUME                   0

  1           LOAD_CONST               0 ('Ada')
              STORE_NAME               0 (name)

  2           LOAD_NAME                1 (print)
              PUSH_NULL
              LOAD_CONST               1 ('Hello,')
              LOAD_NAME                0 (name)
              CALL                     2
              POP_TOP
              LOAD_COMMON_CONSTANT     7 (None)
              RETURN_VALUE
```

Source line 1 became "load the constant `'Ada'`, store it under `name`". Line 2 became "load
`print`, load its two arguments, call it". Bytecode is not machine code, and it changes between
Python versions. When a file is **imported** by another (medium level), CPython saves its
bytecode in a `__pycache__` folder, in a file such as `hello.cpython-315.pyc`, so the next run can
skip compiling. The file you run directly is always compiled afresh.

Because compiling comes first, a grammar mistake anywhere stops the whole file before a single
line runs:

```python
print("start")
print("end"
```

```text
  File "/tmp/broken.py", line 2
    print("end"
         ^
SyntaxError: '(' was never closed
```

`start` was never printed. The error message names the file, the line and the problem, and the
caret `^` points at where Python noticed it.

## The interactive shell and scripts

There are two ways to give Python your code.

- The **interactive shell**, also called the **REPL** (read, evaluate, print, loop), starts when
  you type `python` with nothing after it. It shows the prompt `>>>`, runs each line as soon as
  you press Enter and **echoes** the value of an expression you type. It is a calculator and a
  place to try ideas.
- A **script** is a `.py` file you run with `python hello.py`. It is how real programs are kept,
  shared and rerun.

```text
>>> 2 + 3
5
>>> print("Hi")
Hi
>>> 10 / 4
2.5
```

One difference catches beginners: a script does **not** echo values. A file containing the two
lines `2 + 3` and `print(2 + 3)` prints `5` once, from the `print`. The first line computes 5
and throws it away. In a script, `print` is how you show anything.

## Lexis, syntax and semantics

A natural language has three layers, and so does Python.

- **Lexis** is the vocabulary: which tokens exist. Python's lexis includes **keywords**, words
  with a fixed meaning such as `if`, `for` and `True`, plus names, numbers, strings, operators
  and punctuation.
- **Syntax** is the grammar: how tokens may be arranged. `print("end"` uses valid tokens but
  breaks the rule that every `(` needs a `)`, so it is a `SyntaxError`.
- **Semantics** is the meaning: what a grammatically correct statement does when it runs, and
  whether that makes sense.

A program can be perfect in lexis and syntax and still fail when it runs:

```python
print("start")
print(10 / 0)
print("end")
```

```text
start
Traceback (most recent call last):
  File "/tmp/divide.py", line 2, in <module>
    print(10 / 0)
          ~~~^~~
ZeroDivisionError: division by zero
```

This time `start` appears: the file compiled, line 1 ran, and line 2 asked for something
meaningless. An error found while the program runs is an **exception**, and the report is a
**traceback**, which lesson 2 teaches you to read. Misspelling a name is also caught only at run
time: `prnt("end")` gives `NameError: name 'prnt' is not defined. Did you mean: 'print'?`

## Where Python is used

Python runs web back ends (Django, Flask), scientific and numeric work (NumPy, SciPy, pandas),
data analysis and machine learning, test and build tools, system administration and everyday
automation, and it is a favourite first language for teaching. Its large standard library and
the thousands of packages on the Python Package Index (PyPI) are a big part of why.

## Versions, and why this course uses 3.15

Python 3 replaced Python 2, which reached its end of life on 1 January 2020; everything here is
Python 3. A
new feature version comes out every October. **Python 3.15** was released on 9 October 2026. Each
version gets about two years of bug fixes and then security fixes until five years after release,
so 3.15 is supported until October 2031. Almost everything in this course also works in 3.12 to
3.14; where a lesson uses something new in 3.15, it says so.

## Common mistakes

- **Expecting a script to echo values.** `2 + 3` on its own line in a file shows nothing. Use
  `print(2 + 3)`.
- **Typing shell commands into the REPL.** `python hello.py` typed after `>>>` is a
  `SyntaxError`. Leave the REPL with `quit()` first, then run the command in your terminal.
- **Thinking a script runs until the first broken line.** A `SyntaxError` anywhere stops the whole
  file before line 1 runs. Exceptions, by contrast, happen at run time, after earlier lines have
  run.
- **Confusing "interpreted" with "no compiler at all".** CPython compiles to bytecode first; the
  virtual machine then interprets the bytecode.

## Practice

1. Is a missing `)` a problem of lexis, syntax or semantics? What about dividing by zero?
2. A file contains `print("one")`, then `print("two"`, then `print("three")`. What does running
   it print?
3. In the REPL you type `7 * 6`. What appears? What would a script with the same single line print?

### Answers

1. A missing `)` is **syntax**: the tokens are valid, their arrangement is not. Dividing by zero is
   **semantics**: the statement is grammatical but meaningless when it runs, so Python raises
   `ZeroDivisionError`.
2. Nothing except `SyntaxError: '(' was never closed`, pointing at line 2. The file is compiled
   before anything runs, so `one` is never printed.

3. The REPL echoes `42`. The script prints nothing, because only `print` shows output in a script.

## Key takeaways

- A program is a list of instructions; you write it as source code in a `.py` file.
- A compiler translates ahead of time; an interpreter carries out instructions as it reads them.
- CPython tokenizes and parses your file, compiles it to bytecode, and runs the bytecode on its
  virtual machine.
- The REPL echoes expression values; a script shows only what you `print`.
- Lexis is the vocabulary, syntax the grammar, semantics the meaning. Syntax errors stop the file
  before it starts; exceptions happen while it runs.
- Python 3.15, released in October 2026, is the current version, supported until 2031.

## Further reading

- [Python tutorial: Whetting your appetite](https://docs.python.org/3.15/tutorial/appetite.html)
- [Python glossary: bytecode, interpreted, REPL](https://docs.python.org/3.15/glossary.html)
- [Language reference: Lexical analysis](https://docs.python.org/3.15/reference/lexical_analysis.html)
- [Status of Python versions](https://devguide.python.org/versions/)
