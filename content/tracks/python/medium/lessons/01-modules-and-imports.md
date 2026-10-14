---
title: Modules and Imports
summary: Use every form of the import statement, see how Python finds a module on the search path, write and import a module of your own with a main guard, and take a first tour of the standard library, including the explicit lazy imports new in 3.15.
minutes: 40
objectives:
  - Import a module or names from it with `import`, `from ... import` and `as`, and explain why `from ... import *` is avoided
  - Explore a module with `dir()` and explain how `sys.path` decides which file an import loads
  - Write a module of your own, import it, and guard its script code with `if __name__ == "__main__":`
  - Use `math`, `random` (with a seed), `platform` and `datetime` from the standard library
  - Defer an import with `lazy import` in Python 3.15
---

## Outline

1. What a module is
2. The forms of `import`
3. Why not `from module import *`
4. Looking inside a module with `dir()`
5. Writing your own module
6. The module search path
7. A tour of the standard library
8. Lazy imports (new in 3.15)

## What a module is

A **module** is a file of Python code whose names other code can use. Every `.py` file you have written is already one. Python ships with hundreds of modules, the **standard library**, and thousands more can be installed (next lesson). Modules let you split a program into files of related code and reuse code you did not write.

Importing a module runs its file once and creates a **module object**. Everything the file defines at top level, its functions, classes and variables, becomes an **attribute** of that object, reached with a dot: `math.sqrt`. Each module has its own **namespace**, so `units.convert` and `money.convert` never clash.

## The forms of `import`

```python
import math
from math import sqrt, pi
from math import factorial as fact
import datetime as dt

print(math.ceil(4.2), math.floor(4.8), math.trunc(-4.8))
print(sqrt(16), round(pi, 4))
print(fact(5), math.hypot(3, 4))
print(dt.date(2026, 10, 9) + dt.timedelta(days=30))
print(type(math), math.__name__)
```

```text
5 4 -4
4.0 3.1416
120 5.0
2026-11-08
<class 'module'> math
```

- `import math` binds one name, `math`, to the module object. You write `math.ceil` every time, which tells the reader exactly where `ceil` comes from.
- `from math import sqrt, pi` binds `sqrt` and `pi` directly. The name `math` itself is **not** defined by this line.
- `as` picks the name to bind: `import datetime as dt`, `from math import factorial as fact`. Use it for long names or to avoid a clash, and stick to well-known aliases.
- `import os.path` imports a module inside a package (lesson 2) and binds `os`, so you call `os.path.join(...)`.

`ceil` rounds up, `floor` rounds down, and `trunc` drops the fraction, so it rounds negative numbers towards zero. `hypot(3, 4)` is the length of the hypotenuse, √(3² + 4²). Imports go at the top of the file, one module per line, standard library first (PEP 8).

## Why not `from module import *`

`from math import *` copies every public name of `math` into your namespace. It is tempting and it hides bugs, because a name you already had is silently replaced:

```python
from math import *

print(pow(2, 10))
print(pow(2, 10, 1000))
```

```text
1024.0
Traceback (most recent call last):
  File "/tmp/b.py", line 4, in <module>
    print(pow(2, 10, 1000))
          ~~~^^^^^^^^^^^^^
TypeError: pow expected 2 arguments, got 3
```

The built-in `pow` accepts a third argument. `math.pow` does not, and the star import put it in its place. A reader also cannot tell where any name came from. The Python tutorial calls the star import "bad practice in production code"; it is acceptable only for a quick session in the interactive shell.

## Looking inside a module with `dir()`

`dir(module)` returns a sorted list of the module's attribute names. With no argument, `dir()` lists the names defined in the current scope:

```python
import math

limit = 10
print(dir())
print([name for name in dir(math) if name.startswith("f")])
```

```text
['__builtins__', '__doc__', '__file__', '__loader__', '__name__', '__package__', '__spec__', 'limit', 'math']
['fabs', 'factorial', 'floor', 'fma', 'fmax', 'fmin', 'fmod', 'frexp', 'fsum']
```

Names with double underscores are set by Python. `fmax` and `fmin` are new in 3.15. Built-in functions such as `print` are not listed; they live in the module `builtins`. In the shell, `help(math.fsum)` shows a function's documentation.

## Writing your own module

Put two files in one folder. `units.py`:

```python
"""Convert distances between miles and kilometres."""

KM_PER_MILE = 1.609344


def miles_to_km(miles):
    return miles * KM_PER_MILE


def km_to_miles(km):
    return km / KM_PER_MILE


def _rounded(value):
    return round(value, 2)


print(f"running units.py, __name__ is {__name__!r}")

if __name__ == "__main__":
    print(_rounded(miles_to_km(26.2)))
```

and `main.py`, which imports it twice:

```python
import units
import units

print(units.miles_to_km(10))
print(units.KM_PER_MILE, units.__name__)
```

```console
$ python units.py
running units.py, __name__ is '__main__'
42.16
$ python main.py
running units.py, __name__ is 'units'
16.09344
1.609344 units
$ ls __pycache__
units.cpython-315.pyc
```

What happened:

- Every module has a variable `__name__`. When you run a file directly, it is `"__main__"`; when the file is imported, it is the module's name. So the code under `if __name__ == "__main__":` runs as a script and is skipped on import. Use this **main guard** for demos, tests and the program's entry point. (The `print` at top level is only there to show when the file runs.)
- The second `import units` did nothing. A module runs once per program; later imports reuse the object Python keeps in the dictionary `sys.modules`. In the shell, `importlib.reload(units)` runs an edited module again.
- Python saved the compiled **bytecode** in `__pycache__/units.cpython-315.pyc`, tagged with the interpreter and version. Next time it loads that file if the source has not changed, which makes importing faster, not running. The file run directly is never cached. Do not commit `__pycache__` to version control.
- A leading underscore marks a name as **private by convention**. `from units import *` skips `_rounded`, though `units._rounded` still works.

## The module search path

`import units` looks for a built-in module of that name, then for `units.py` (or a package) in each folder of the list `sys.path`, in order, and the first match wins:

```python
import sys

for entry in sys.path:
    print(entry)
```

```text
/tmp/project
/usr/local/lib/python315.zip
/usr/local/lib/python3.15
/usr/local/lib/python3.15/lib-dynload
/usr/local/lib/python3.15/site-packages
```

The first entry is the folder of the script you ran. Then come the folders listed in the environment variable `PYTHONPATH`, if set, then the standard library and `site-packages`, where installed packages go. Because your own folder comes first, a file named like a standard module **shadows** it. With a `random.py` of your own next to `dice.py`:

```text
AttributeError: module 'random' has no attribute 'choice' (consider renaming '/tmp/project/random.py' since it has the same name as the standard library module named 'random' and prevents importing that standard library module)
```

## A tour of the standard library

```python
import platform
import random

random.seed(42)
print(random.random())
print(random.choice(["red", "green", "blue"]))
print(random.sample(range(1, 50), 6))
print(random.randint(1, 6))
print(platform.system(), platform.machine(), platform.python_implementation())
print(platform.python_version_tuple())
```

```text
0.6394267984578837
red
[48, 18, 16, 15, 9, 7]
6
Linux x86_64 CPython
('3', '15', '0')
```

- `random()` returns a float with 0.0 ≤ x < 1.0. `choice` picks one item (an empty sequence raises IndexError), `sample(population, k)` picks `k` different items, and `randint(a, b)` includes both ends.
- `seed(42)` makes the sequence repeatable: the same seed gives the same numbers, which is what tests need. Never use `random` for passwords or tokens; that is the job of `secrets`.
- `platform` describes the machine: also `platform()`, `processor()` (often an empty string on Linux), `version()` and `python_version()`. Your output will differ.
- `datetime`, used above, handles dates and times; the professional level covers it fully.

## Lazy imports (new in 3.15)

Python 3.15 adds the soft keyword `lazy` (PEP 810). A lazy import binds the name at once but loads the module only when the name is first used, which speeds up the start of programs that import much and use little:

```python
import sys
lazy import json

print("json" in sys.modules)
print(json.dumps({"ok": True}))
print("json" in sys.modules)
```

```text
False
{"ok": true}
True
```

`lazy` is allowed only at module level, not inside a function, class or `try` block, and never with `*`. An error in loading the module appears where the name is first used.

## Common mistakes

- **Naming a file after a module you import**, such as `random.py` or `math.py`. Rename it and delete its `__pycache__` entry.
- **Expecting `from math import sqrt` to define `math`.** `math.floor(2.5)` then raises `NameError: name 'math' is not defined. Did you forget to import 'math'?`. Import the module too, or import `floor`.
- **Script code without a main guard.** Importing such a file runs its prints and prompts. Put them under `if __name__ == "__main__":`.
- **Expecting an edited module to reload** in a running shell. Restart it or use `importlib.reload`.

## Practice

1. Import `math` so that you can call `sqrt` as `root` and use nothing else from it. Print `root(2)`.
2. Write `greet.py` with `hello(name)` returning `f"Hello, {name}!"`, and a main guard that prints `hello("world")`. What do `python greet.py` and `import greet` each print?
3. With a seed of 7, simulate ten rolls of a die and count the sixes.

### Answers

```python
from math import sqrt as root

print(root(2))
```

```text
1.4142135623730951
```

2. `python greet.py` prints `Hello, world!`; `import greet` prints nothing, because `__name__` is then `"greet"`.

```python
def hello(name):
    return f"Hello, {name}!"


if __name__ == "__main__":
    print(hello("world"))
```

3. The seed makes the result the same on every run:

```python
import random

random.seed(7)
rolls = [random.randint(1, 6) for _ in range(10)]
print(rolls, rolls.count(6))
```

```text
[3, 2, 4, 6, 1, 1, 5, 1, 3, 5] 1
```

## Key takeaways

- `import m` binds the module; `from m import x` binds only `x`; `as` renames; avoid `import *`.
- A module runs once and is cached in `sys.modules`; its bytecode is cached in `__pycache__`.
- `sys.path` is searched in order, starting with the script's folder, so never shadow a standard module.
- `if __name__ == "__main__":` separates what a file does when run from what it offers when imported.
- `lazy import` (3.15) defers loading a module until its first use.

## Further reading

- [The Python Tutorial: Modules](https://docs.python.org/3.15/tutorial/modules.html)
- [The import statement](https://docs.python.org/3.15/reference/simple_stmts.html#the-import-statement)
- [random: Generate pseudo-random numbers](https://docs.python.org/3.15/library/random.html)
- [PEP 810: Explicit lazy imports](https://peps.python.org/pep-0810/)
