---
title: Packages and Virtual Environments
summary: Group modules into packages with `__init__.py`, import within them with absolute and relative imports, run a package module with `python -m`, and install third-party packages from PyPI with pip into a virtual environment, pinned in a requirements file.
minutes: 40
objectives:
  - Build a package with nested subpackages and import from it in each of the ways Python allows
  - Write relative imports inside a package and run a package module with `python -m`
  - Create, activate and use a virtual environment with `venv`
  - Install, pin and reproduce dependencies with pip, version specifiers and a requirements file
  - Judge whether a package from PyPI deserves your trust
---

## Outline

1. From modules to packages
2. `__init__.py` and nested packages
3. Absolute and relative imports
4. Running a module inside a package
5. Namespace packages
6. Virtual environments
7. Installing with pip
8. Requirements files and trust

## From modules to packages

Lesson 1 imported single files. When a project grows to many modules, you group them in a **package**: a folder of modules that Python imports by a dotted name. `weather.stats.summary` means the module `summary` in the subpackage `stats` of the package `weather`. The standard library does the same: `os.path`, `xml.etree.ElementTree` and `email.mime.text` are modules inside packages.

## `__init__.py` and nested packages

This project has a package `weather` with a subpackage `stats`, and a script next to it:

```text
project/
    report.py
    weather/
        __init__.py
        convert.py
        stats/
            __init__.py        (empty)
            summary.py
```

`weather/convert.py` defines `c_to_f(celsius)` and `f_to_c(fahrenheit)`. `weather/__init__.py` is the package's own code:

```python
"""Tools for a home weather station."""

from .convert import c_to_f

print(f"initialising package {__name__}")
```

`report.py` imports from the package in four ways:

```python
import weather
from weather import convert
from weather.stats.summary import describe
import weather.stats.summary as summary

print(weather.c_to_f(20))
print(convert.f_to_c(212))
print(describe([12.5, 17.0, 9.5]))
print(summary.__name__, weather.__file__)
```

```text
initialising package weather
68.0
100.0
low 9.5 C (49.1 F), high 17.0 C (62.6 F)
weather.stats.summary /tmp/project/weather/__init__.py
```

- A folder with an `__init__.py` is a **regular package**. Importing the package runs its `__init__.py` once, and the names it defines become the package's attributes. That is how `weather.c_to_f` works: `__init__.py` imported it, so users need not know which module holds it.
- `__init__.py` may be empty. Keep it small: everything in it runs on every import of the package.
- In `import a.b.c`, every name but the last must be a package. `from weather import convert` loads a submodule, and `from weather.stats.summary import describe` reaches a function.
- If `__init__.py` defines a list `__all__`, `from weather import *` imports exactly those names.

## Absolute and relative imports

`weather/stats/summary.py` needs `c_to_f` from `weather/convert.py`. It can name the full path, an **absolute import**, or a path relative to its own package, a **relative import**:

```python
from ..convert import c_to_f          # relative: up from stats to weather
# from weather.convert import c_to_f  # absolute: the same function


def describe(readings):
    low, high = min(readings), max(readings)
    return f"low {low} C ({c_to_f(low):.1f} F), high {high} C ({c_to_f(high):.1f} F)"


if __name__ == "__main__":
    print(describe([12.5, 17.0, 9.5]))
```

One dot means the current package (`stats`), two dots its parent (`weather`). Relative imports exist only in the `from ... import` form: `import .convert` is a SyntaxError. PEP 8 recommends absolute imports; relative ones are fine inside a package when the absolute path would be long.

## Running a module inside a package

Running that file directly fails:

```console
$ python weather/stats/summary.py
Traceback (most recent call last):
  File "/tmp/project/weather/stats/summary.py", line 1, in <module>
    from ..convert import c_to_f
ImportError: attempted relative import with no known parent package
$ python -m weather.stats.summary
initialising package weather
low 9.5 C (49.1 F), high 17.0 C (62.6 F)
```

Run as a file, `summary.py` is just `__main__`, with no package, so `..` means nothing. `python -m weather.stats.summary` imports it by its dotted name from the current folder, so the package is known and the main guard still runs. Each folder of the package now has its own `__pycache__`.

## Namespace packages

A folder **without** `__init__.py` can still be imported. It becomes a **namespace package**, whose parts may even come from several folders on `sys.path`. For a folder `plugins/` holding `hello.py`, `import plugins.hello` works, `plugins.__file__` is `None` and `plugins.__path__` lists the folders it was found in. Namespace packages are meant for large projects split across distributions. For your own code, write the `__init__.py`.

## Virtual environments

**Third-party packages** are published on PyPI, the Python Package Index, and installed with **pip**. If every project installed into the one Python on your machine, project A needing version 1 of a package and project B needing version 2 would conflict. A **virtual environment** is a folder with its own `site-packages` and its own `python` that uses your installed interpreter. Make one per project, named `.venv` by convention:

```console
$ python -m venv .venv
$ ls .venv
bin  include  lib  pyvenv.cfg
$ source .venv/bin/activate
(.venv) $ which python
/tmp/project/.venv/bin/python
(.venv) $ python -m pip list
Package Version
------- -------
pip     26.2.1
(.venv) $ deactivate
```

On Windows, create it with `py -m venv .venv`, and the folder is `.venv\Scripts` instead of `.venv/bin`: activate with `.venv\Scripts\activate` in cmd or `.venv\Scripts\Activate.ps1` in PowerShell. Activating puts that folder first on your `PATH` and shows the name in the prompt. It is a convenience: `.venv/bin/python script.py` uses the environment without it. Inside Python, `sys.prefix != sys.base_prefix` is `True` in a virtual environment.

A virtual environment is disposable. It contains absolute paths, so you never move, copy or commit it; since Python 3.13 `venv` writes a `.gitignore` inside it for you. Delete it and create it again whenever you like.

## Installing with pip

Run pip through the interpreter, `python -m pip`, so that it installs into the Python you are actually using:

```console
(.venv) $ python -m pip install requests
(.venv) $ python -m pip install "requests==2.32.3"
(.venv) $ python -m pip install "requests>=2.32,<3"
(.venv) $ python -m pip install --upgrade requests
(.venv) $ python -m pip show requests
(.venv) $ python -m pip uninstall requests
```

A **version specifier** limits which versions pip may choose:

| Specifier | Means |
| --- | --- |
| `==2.32.3` | exactly this version (`==2.32.*` any 2.32 release) |
| `>=2.32,<3` | every clause at once: a comma means "and" |
| `!=2.32.0` | any version except this one |
| `~=2.32.3` | a compatible release: `>=2.32.3` and `==2.32.*` |

Quote specifiers in the shell, where `<` and `>` mean redirection. The name you install is not always the name you import: `pip install pillow` gives `import PIL`, and `pip install beautifulsoup4` gives `import bs4`.

## Requirements files and trust

A **requirements file** lists one requirement per line, with optional specifiers and `#` comments:

```text
# requirements.txt
requests==2.32.3
numpy>=2.0,<3
```

`python -m pip install -r requirements.txt` installs them all. `python -m pip freeze > requirements.txt` writes one for you, with the exact version of every installed package, including the dependencies pip pulled in. Commit `requirements.txt`, not `.venv`. Anyone can recreate your environment with a fresh venv and `pip install -r`. The professional level replaces this with `pyproject.toml` and lock files.

Anyone can publish to PyPI, and installing a package runs code its author wrote. Before you install: spell the name exactly, because attackers publish **typosquats** such as `reqeusts`; check that the project is maintained and its source is linked; and prefer a few well-known packages to many small ones. The standard library may already do the job.

## Common mistakes

- **Running a package module as a file.** `ImportError: attempted relative import with no known parent package` means: use `python -m package.module` from the project folder.
- **Installing into the wrong Python.** `pip install` succeeded, yet `import requests` raises `ModuleNotFoundError`. The `pip` on your `PATH` belonged to another interpreter. Activate the environment and use `python -m pip`.
- **Installing into the system Python** on Linux gives `error: externally-managed-environment` (PEP 668). Create a virtual environment instead.
- **Committing or copying `.venv`.** Commit `requirements.txt` and recreate the environment.

## Practice

1. In a package `garden`, the module `garden/plants/roses.py` needs `water` from `garden/tools.py`. Write the import both ways.
2. Which versions does `~=1.4.2` accept among 1.4.1, 1.4.9, 1.5.0?
3. Write a function `in_virtualenv()` that returns whether the running Python is a virtual environment's.

### Answers

1. Absolute: `from garden.tools import water`. Relative: `from ..tools import water`, since `..` is the package `garden`.
2. Only 1.4.9. `~=1.4.2` means `>=1.4.2` and `==1.4.*`, so 1.4.1 is too old and 1.5.0 is outside 1.4.

```python
import sys


def in_virtualenv():
    return sys.prefix != sys.base_prefix


print(in_virtualenv())
```

```text
False
```

3. Outside an environment both prefixes are the installation folder, so the function returns `False`, as in the sandbox.

## Key takeaways

- A package is a folder of modules; `__init__.py` runs on import and shapes what the package offers.
- Absolute imports name the full path; relative imports (`.`, `..`) work only inside a package run with `python -m`.
- One virtual environment per project, created with `python -m venv .venv`, never committed.
- Install with `python -m pip`, limit versions with specifiers, and record them in `requirements.txt`.
- Installing a package runs its author's code: check the name and the project first.

## Further reading

- [The Python Tutorial: Packages](https://docs.python.org/3.15/tutorial/modules.html#packages)
- [The Python Tutorial: Virtual Environments and Packages](https://docs.python.org/3.15/tutorial/venv.html)
- [venv: Creation of virtual environments](https://docs.python.org/3.15/library/venv.html)
- [Python Packaging User Guide: Installing packages](https://packaging.python.org/en/latest/tutorials/installing-packages/)
