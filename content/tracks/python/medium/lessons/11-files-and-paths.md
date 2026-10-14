---
title: Files and Paths
summary: Open, read and write text and binary files safely with `with`, choose the right mode, know what encoding and newline translation do (UTF-8 is the default from Python 3.15), work with paths through `pathlib`, and handle `OSError` and its subclasses by their `errno`.
minutes: 40
objectives:
  - Open files in the right mode and always close them with `with`
  - Read a file with `read`, `readline`, `readlines` or a `for` loop, and write with `write` and `print`
  - Give the encoding explicitly and explain universal newlines and the 3.15 UTF-8 default
  - Build, inspect, list and read paths with `pathlib.Path`
  - Handle FileNotFoundError, PermissionError and other OSErrors, and read binary data into a `bytearray`
---

## Outline

1. Streams and file objects
2. Opening and closing: modes and `with`
3. Writing and reading text
4. Encodings and newlines
5. Paths with `pathlib`
6. When files fail: OSError and `errno`
7. Binary files and `bytearray`

## Streams and file objects

Programs exchange data with the world through **streams**: sequences of bytes or characters read or written in order. `open()` connects your program to a file and returns a **file object**, also called a **handle**: the Python object through which you use the stream. Every program also starts with three open streams in the `sys` module: `sys.stdin` (what `input()` reads), `sys.stdout` (where `print` writes) and `sys.stderr` (for error messages, which stay visible when output is redirected to a file). `print("failed", file=sys.stderr)` writes to the error stream.

## Opening and closing: modes and `with`

`open(file, mode="r", encoding=None)` takes a path and a **mode**:

| Mode | Meaning |
| --- | --- |
| `"r"` | read (the default); FileNotFoundError if missing |
| `"w"` | write; creates the file, or **empties** an existing one |
| `"a"` | append to the end; creates the file if missing |
| `"x"` | create a new file; FileExistsError if it exists |
| `"b"` | added to the above: binary, `bytes` instead of `str` |
| `"t"` | text, the default |
| `"+"` | added: reading and writing, as in `"r+"` |

A file must be **closed** when you are done, which writes out any buffered data and frees the handle. Use the `with` statement, which closes the file however the block ends, even by an exception:

```python
with open("notes.txt", "w", encoding="utf-8") as file:
    count = file.write("first line\n")
    file.write("second line\n")
    print("café au lait", file=file)
print(count, file.closed)

with open("notes.txt", encoding="utf-8") as file:
    print(repr(file.readline()))
    print(repr(file.read(6)))
    print(file.readlines())
    print(repr(file.readline()))

with open("notes.txt", "a", encoding="utf-8") as file:
    file.write("appended\n")

with open("notes.txt", encoding="utf-8") as file:
    for number, line in enumerate(file, start=1):
        print(number, line.rstrip("\n"))
```

```text
11 True
'first line\n'
'second'
[' line\n', 'café au lait\n']
''
1 first line
2 second line
3 café au lait
4 appended
```

Without `with`, you would call `file.close()` yourself, and an exception before that line would leave the file open.

## Writing and reading text

- `write(text)` writes a string and returns the number of characters written. It adds **no** newline: you write `"\n"` yourself. `print(..., file=file)` adds one, like printing to the screen.
- `read()` returns the rest of the file as one string, and `read(n)` at most `n` characters. A file object remembers its position, so each read continues where the last stopped.
- `readline()` returns the next line **including** its `"\n"`, and an empty string at the end of the file. An empty line inside the file is `"\n"`, so `""` always means the end.
- `readlines()` returns a list of the remaining lines.
- Iterating with `for line in file` reads one line at a time. It is the usual way to process a file, because it never holds the whole file in memory. Strip the newline with `rstrip("\n")`, or `strip()` to remove surrounding spaces as well.

## Encodings and newlines

A text file is bytes on disk, so reading and writing text needs an encoding (lesson 3). Since Python 3.15, `open()` uses **UTF-8** when you pass no encoding, on every system (PEP 686). Before 3.15 the default depended on the system's locale, and on Windows it was often not UTF-8, so the same program could read a file differently on two machines. Pass `encoding="utf-8"` anyway: the intent is clear, and the code also works on older Pythons.

```python
from pathlib import Path

Path("windows.txt").write_bytes(b"one\r\ntwo\r\n")
print(Path("windows.txt").read_text(encoding="utf-8").split("\n"))
with open("windows.txt", encoding="utf-8", newline="") as file:
    print(file.readlines())
Path("old.txt").write_text("café", encoding="latin-1")
print(Path("old.txt").read_bytes())
try:
    Path("old.txt").read_text(encoding="utf-8")
except UnicodeDecodeError as error:
    print(error)
print(Path("old.txt").read_text(encoding="latin-1"))
```

```text
['one', 'two', '']
['one\r\n', 'two\r\n']
b'caf\xe9'
'utf-8' codec can't decode byte 0xe9 in position 3: unexpected end of data
café
```

- Windows ends lines with `\r\n`, Linux and macOS with `\n`. In text mode, **universal newlines** turn every line ending into `"\n"` when reading, so your code sees one convention. `newline=""` turns that off; the `csv` module needs it. When writing, `"\n"` becomes the system's line ending.
- A file written in another encoding fails to decode as UTF-8, or decodes to the wrong characters. Ask where the file came from and pass its real encoding.

## Paths with `pathlib`

`pathlib.Path` represents a file system path as an object, with the operations you need:

```python
from pathlib import Path

folder = Path("journal")
folder.mkdir(exist_ok=True)
for day, weather in [("2026-10-01", "rain"), ("2026-10-02", "sun"), ("2026-10-03", "wind")]:
    (folder / f"{day}.txt").write_text(f"{weather}\n", encoding="utf-8")
(folder / "readme.md").write_text("# Journal\n", encoding="utf-8")

path = folder / "2026-10-02.txt"
print(path, path.name, path.stem, path.suffix, path.parent)
print(path.exists(), path.is_file(), folder.is_dir(), (folder / "nope.txt").exists())
print(repr(path.read_text(encoding="utf-8")))
for entry in sorted(folder.glob("*.txt")):
    print(entry.name, entry.read_text(encoding="utf-8").strip())
```

```text
journal/2026-10-02.txt 2026-10-02.txt 2026-10-02 .txt journal
True True True False
'sun\n'
2026-10-01.txt rain
2026-10-02.txt sun
2026-10-03.txt wind
```

- The `/` operator joins paths with the right separator for the system: `\` on Windows, `/` elsewhere. Never build paths by adding strings.
- `name`, `stem`, `suffix` and `parent` take a path apart without string slicing.
- `exists()`, `is_file()` and `is_dir()` ask the file system.
- `glob("*.txt")` yields the matching paths in **no particular order**: sort them when order matters. `rglob` searches subfolders too. `mkdir(parents=True, exist_ok=True)` creates a folder and its parents.
- `read_text()` and `write_text()` open, read or write, and close in one call; `write_text` replaces the file. `path.open()` and `open(path)` give a file object for line-by-line work.

A relative path such as `Path("journal")` is relative to the **current working directory**, the folder the program was started from, not the folder of the script. `Path.cwd()` shows it.

## When files fail: OSError and `errno`

Failures of the operating system raise **OSError** or one of its subclasses. Each carries `errno`, the system's error number, and `strerror`, its description; the `errno` module names the numbers:

```python
import errno
from pathlib import Path

Path("notes.txt").write_text("hello\n", encoding="utf-8")
Path("locked.txt").write_text("secret\n", encoding="utf-8")
Path("locked.txt").chmod(0)
for name, mode in [("notes.txt", "x"), ("missing.txt", "r"), ("locked.txt", "r"), (".", "r")]:
    try:
        with open(name, mode, encoding="utf-8") as file:
            file.read()
    except OSError as error:
        print(type(error).__name__, error.errno, errno.errorcode[error.errno], error.strerror)
```

```text
FileExistsError 17 EEXIST File exists
FileNotFoundError 2 ENOENT No such file or directory
PermissionError 13 EACCES Permission denied
IsADirectoryError 21 EISDIR Is a directory
```

`chmod(0)` removed every permission from `locked.txt`. Catch the most specific class you can handle: `except FileNotFoundError` for a missing file, with a clear message for the user; or compare `error.errno == errno.ENOENT` when you hold a plain OSError. The numbers shown are Linux's; the names are the same everywhere. As lesson 10 advised, open the file and handle the error rather than checking `exists()` first.

## Binary files and `bytearray`

With `"b"` in the mode, no decoding happens: `read` returns `bytes`, and you write `bytes`. Images, archives and any format that is not text must be opened this way. A **`bytearray`** is a mutable `bytes`, and `readinto` fills one that you allocated, which reuses one buffer instead of creating new objects:

```python
from pathlib import Path

Path("data.bin").write_bytes(bytes([71, 73, 70, 56, 57, 97, 10, 0, 20, 0]))
with open("data.bin", "rb") as file:
    header = file.read(6)
    buffer = bytearray(2)
    count = file.readinto(buffer)
    print(header, count, buffer, list(buffer))
    buffer[0] = 255
    print(buffer, file.read())
```

```text
b'GIF89a' 2 bytearray(b'\n\x00') [10, 0]
bytearray(b'\xff\x00') b'\x14\x00'
```

These are the first bytes of a GIF image: a six-byte signature, then the width. `readinto` returned the number of bytes it read, 2; at the end of a file it reads fewer.

## Common mistakes

- **Opening with `"w"` to add to a file.** It empties the file first. Use `"a"`.
- **Forgetting that lines keep their `"\n"`**: `line == "done"` is never true for `"done\n"`. Strip it.
- **Reading a file twice from one handle.** The second `read()` returns `""`, because the position is at the end.
- **Writing a number**: `file.write(42)` raises `TypeError: write() argument must be str, not int`. Convert it or use `print(..., file=file)`.
- **Relying on the current directory** for a file next to your script. Use `Path(__file__).parent / "data.txt"`.

## Practice

1. Write `count_lines(path)` returning the number of non-blank lines of a text file.
2. Write `newest(folder)` returning the name of the last `.txt` file in sorted order, or `None` if there is none.

### Answers

```python
from pathlib import Path


def count_lines(path):
    with open(path, encoding="utf-8") as file:
        return sum(1 for line in file if line.strip())


def newest(folder):
    names = sorted(entry.name for entry in Path(folder).glob("*.txt"))
    return names[-1] if names else None


Path("list.txt").write_text("tea\n\n  \nmilk\n", encoding="utf-8")
print(count_lines("list.txt"), newest("journal"), newest("empty"))
```

```text
2 2026-10-03.txt None
```

`glob` on a folder that does not exist yields nothing, so `newest("empty")` returns `None`.

## Key takeaways

- Open files with `with open(path, mode, encoding="utf-8")`: the file is always closed.
- `"w"` empties, `"a"` appends, `"x"` refuses to overwrite; add `"b"` for bytes.
- Iterate over a file to read it line by line; each line keeps its `"\n"`.
- UTF-8 is the default from 3.15, and universal newlines hide `\r\n`.
- `pathlib.Path` joins with `/`, inspects, lists and reads paths. OSError subclasses and `errno` say what failed.

## Further reading

- [The Python Tutorial: Reading and writing files](https://docs.python.org/3.15/tutorial/inputoutput.html#reading-and-writing-files)
- [Built-in functions: open](https://docs.python.org/3.15/library/functions.html#open)
- [pathlib: Object-oriented filesystem paths](https://docs.python.org/3.15/library/pathlib.html)
- [PEP 686: Make UTF-8 mode default](https://peps.python.org/pep-0686/)
