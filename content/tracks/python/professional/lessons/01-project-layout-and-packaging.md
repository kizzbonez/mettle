---
title: Project Layout and Packaging
summary: Turn a folder of modules into a project other people can install. Lay it out in the src layout, describe it in pyproject.toml with dependencies and a console script, build wheels and sdists, install it in editable mode, and pin an application's dependencies in a lock file.
minutes: 35
objectives:
  - Lay out a project in the src layout and explain which mistakes it catches
  - Write a pyproject.toml with a build system, metadata, dependencies, extras, dependency groups and a console script
  - Build an sdist and a wheel, and install a project in editable mode while you work on it
  - Read version specifiers, and pin an application's dependencies with a lock file
---

## Outline

1. Distribution packages, build backends and frontends
2. The src layout
3. `pyproject.toml`
4. Entry points and console scripts
5. Building sdists and wheels
6. Editable installs
7. Versions
8. Lock files and tools

## Distribution packages, build backends and frontends

In the medium level you installed other people's code with `pip` into a virtual environment. This
lesson is the other side: making your own code installable. Two words need separating. An
**import package** is what you `import`. A **distribution package** is what you install and what
PyPI stores. Their names may differ: you install `scikit-learn` and import `sklearn`.

A **build backend** (Hatchling, setuptools, Flit, uv_build) turns a source tree into distribution
files. A **build frontend** (`pip`, `build`, `uv`) reads the project's `pyproject.toml`, installs
the backend it names into a temporary environment, and asks it to build. Because the file names the
backend, any frontend can build any project.

## The src layout

The Python Packaging User Guide recommends this shape:

```text
tally/
├── pyproject.toml
├── README.md
├── LICENSE
├── src/
│   └── tally/
│       ├── __init__.py
│       └── cli.py
└── tests/
    └── test_cli.py
```

In the **flat layout** the `tally/` package sits next to `pyproject.toml`. That looks simpler, but
Python puts the script's folder (or the current folder, for `python -m` and the REPL) first on
`sys.path`, so tests run from the project root import the folder instead of the installed copy. A
module you forgot to include in the wheel goes unnoticed until a user installs it. In the **src
layout** nothing importable sits in the root, so the code only imports once it is installed:

```python
import sys
from pathlib import Path

package = Path("src/tally")
package.mkdir(parents=True)
(package / "__init__.py").write_text('__version__ = "0.1.0"\n')
(package / "cli.py").write_text("def main():\n    print('tally 0.1.0')\n    return 0\n")

try:
    import tally
except ModuleNotFoundError as error:
    print("before install:", error)

sys.path.insert(0, str(Path("src").resolve()))  # what an editable install arranges
import tally
from tally.cli import main

print("after install:", tally.__version__, tally.__file__)
print("exit status:", main())
```

```text
before install: No module named 'tally'
after install: 0.1.0 /tmp/src/tally/__init__.py
tally 0.1.0
exit status: 0
```

## `pyproject.toml`

One TOML file describes the project. TOML is a small configuration format of `[tables]` and
`key = value` lines; lesson 3 reads it with `tomllib`.

```toml
[build-system]
requires = ["hatchling >= 1.26"]
build-backend = "hatchling.build"

[project]
name = "tally"
version = "0.1.0"
description = "Add up numbers from the command line"
readme = "README.md"
requires-python = ">= 3.13"
license = "MIT"
license-files = ["LICEN[CS]E*"]
authors = [{ name = "Ada Example", email = "ada@example.com" }]
dependencies = ["rich >= 13"]

[project.optional-dependencies]
yaml = ["pyyaml >= 6.0"]

[project.scripts]
tally = "tally.cli:main"

[dependency-groups]
test = ["pytest >= 8", "coverage"]
```

- **`[build-system]`** names the backend. The guide says it should always be present.
- **`[project]`** is the metadata. `name` and `version` are required; `version` may instead be
  listed in `dynamic = ["version"]` so the backend fills it in. `requires-python` stops installers
  from putting the project on an older Python. `license` is an SPDX expression such as `"MIT"`
  (PEP 639); the older `license = {text = ...}` table is deprecated.
- **`dependencies`** are what the project needs at run time, written as **version specifiers**:
  `>=` and `<` compare, `==` pins, `!=` excludes, and `~= 2.2` means "2.2 or later, but below 3".
  A marker after `;` limits a requirement to some platforms: `"colorama; os_name == 'nt'"`.
- **`[project.optional-dependencies]`** defines **extras**, installed on request:
  `pip install "tally[yaml]"`.
- **`[dependency-groups]`** (PEP 735) lists tools for working on the project, such as test
  runners. Groups never go into the built package's metadata. `pip install --group test`
  installs one; `uv sync` installs the group named `dev` by default.

## Entry points and console scripts

`[project.scripts]` maps a command name to an **object reference**, `module:function`. When pip
installs the project, it writes a small `tally` executable into the environment's `bin` (or
`Scripts` on Windows) folder. The entry points specification shows what the wrapper does:

```python
import sys
from tally.cli import main
sys.exit(main())
```

So `main` takes no arguments (it reads `sys.argv` itself, as lesson 4 shows), and its return value
becomes the exit status: `None` or `0` for success, another integer for failure. An installed
project's metadata, entry points included, can be read with `importlib.metadata`. The sandbox has
NumPy installed:

```python
from importlib.metadata import entry_points, metadata, version

print(version("numpy"))
info = metadata("numpy")
print(info["Name"], info["Requires-Python"])
for script in entry_points(group="console_scripts"):
    print(f"{script.name} = {script.value}")
```

```text
2.5.4
numpy >=3.12
pip = pip._internal.cli.main:main
pip3 = pip._internal.cli.main:main
f2py = numpy.f2py.f2py2e:main
numpy-config = numpy._configtool:main
```

## Building sdists and wheels

A **source distribution** (sdist, `.tar.gz`) is the source plus metadata; installing it runs the
backend on the user's machine. A **wheel** (`.whl`) is a ready-built zip that pip unpacks without
building. Upload both. The tags in the wheel's name (`py3-none-any`) say it suits any Python 3 on
any platform; wheels with compiled code carry a specific interpreter and platform instead.

```console
$ python -m pip install --upgrade build
$ python -m build
$ ls dist/
tally-0.1.0-py3-none-any.whl
tally-0.1.0.tar.gz
```

`uv build` produces the same two files. Publishing to PyPI is `python -m twine upload dist/*`; try
TestPyPI first with `--repository testpypi`.

## Editable installs

While developing, install the project in **editable** mode inside its virtual environment:

```console
$ python -m pip install -e .
```

Pip does not copy the code. It adds the project's source folder to the import path, so every edit
is live, as the `sys.path.insert` line simulated above. Reinstall only when the metadata changes:
a new dependency, a new console script, a new version. Run your tests against a regular install too
before a release, because the two can behave differently.

## Versions

Python versions follow PEP 440: `1.4.0`, pre-releases `1.5.0a1`, `1.5.0b2` and `1.5.0rc1`, and
`1.5.0.dev3` for snapshots. Most projects add Semantic Versioning's meaning: raise the major number
for breaking changes, the minor for features, the patch for fixes. Keep the version in one place,
`pyproject.toml`, and read it at run time instead of copying it:

```python
from importlib.metadata import PackageNotFoundError, version


def installed_version(name):
    try:
        return version(name)
    except PackageNotFoundError:
        return None


def release_tuple(text):
    return tuple(int(part) for part in text.split("."))


print(installed_version("numpy"), installed_version("tally"))
print("1.10.0" > "1.9.0")
print(release_tuple("1.10.0") > release_tuple("1.9.0"))
```

```text
2.5.4 None
False
True
```

Strings compare character by character, so `"1.10.0"` sorts before `"1.9.0"`. Compare versions as
numbers; in real code use the `packaging` library's `Version`, which also understands `rc` and
`dev`.

## Lock files and tools

`dependencies` should be loose ranges, so a **library** fits into many projects. An **application**
also needs to be reproducible: the same exact versions, including dependencies of dependencies, on
every machine. That is a **lock file**.

- **pip-tools**: `pip-compile pyproject.toml -o requirements.txt` writes exact `==` pins with
  `# via` comments; `pip-sync` makes the environment match.
- **uv**: `uv add rich` edits `pyproject.toml`, `uv lock` writes a cross-platform `uv.lock`, and
  `uv sync` installs exactly what it says. Commit `uv.lock`.
- **pip**: `pip lock` writes the standard `pylock.toml` (PEP 751). It is still marked experimental.

## Common mistakes

- **Testing only the source tree.** In a flat layout tests pass while the wheel lacks a module. Use
  the src layout and test an installed copy.
- **A console script whose function needs arguments.** `tally = "tally.cli:run"` with
  `def run(argv):` fails with `TypeError: run() missing 1 required positional argument: 'argv'`.
  Give the parameter a default: `def run(argv=None):`.
- **Pinning `==` in a library's `dependencies`.** Two libraries pinning different versions cannot be
  installed together. Pin in the application's lock file instead.
- **Forgetting to reinstall** after adding a script or dependency to an editable install. The new
  command does not exist until you run `pip install -e .` again.

## Practice

1. Write the `[project.scripts]` line for a command `tally-report` that calls `report` in
   `tally/reporting.py`.
2. Which versions does `~= 1.4.2` accept: `1.4.9`, `1.5.0`, `2.0`?
3. Where do pytest and Ruff belong in `pyproject.toml`, and why not in `dependencies`?

### Answers

1. `tally-report = "tally.reporting:report"`. The part before the colon is the module's import
   path, the part after it the function.
2. Only `1.4.9`. `~= 1.4.2` means `>= 1.4.2, == 1.4.*`: the last given part may grow, the others
   are fixed.
3. In `[dependency-groups]`, for example `dev = ["pytest", "ruff"]`. Users of the package need
   neither, and groups never reach the published metadata.

## Key takeaways

- `pyproject.toml` names the build backend and holds the metadata, dependencies, extras and scripts.
- The src layout forces you to test installed code, so packaging mistakes show up early.
- `[project.scripts]` turns `module:function` into a command whose return value is the exit status.
- `python -m build` makes an sdist and a wheel; `pip install -e .` gives a live install for work.
- Libraries declare ranges; applications pin exact versions in a lock file such as `uv.lock`.

## Further reading

- [Packaging Python Projects (tutorial)](https://packaging.python.org/en/latest/tutorials/packaging-projects/)
- [Writing your pyproject.toml](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/)
- [src layout vs flat layout](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/)
- [uv: Working on projects](https://docs.astral.sh/uv/guides/projects/)
