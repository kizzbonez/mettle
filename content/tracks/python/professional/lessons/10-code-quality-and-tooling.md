---
title: Code Quality and Tooling
summary: Keep a Python codebase readable and healthy as it grows. Follow PEP 8 and PEP 257, let Ruff lint and format the code, run mypy in continuous integration, catch problems before each commit with pre-commit, write docstrings that become documentation, and review code well.
minutes: 35
objectives:
  - Apply the main PEP 8 conventions and write PEP 257 docstrings that help() and documentation tools can show
  - Explain what a linter and a formatter do, and configure Ruff in pyproject.toml
  - Run mypy and read its errors, and combine lint, format, type and test checks in CI and pre-commit
  - Review code for correctness and clarity, and keep a codebase healthy over time
---

## Outline

1. Why quality is a team matter
2. PEP 8 and PEP 257
3. Linters: how they work
4. Ruff: linter and formatter
5. Type checkers in CI
6. pre-commit hooks
7. Dev mode and warnings
8. Reviewing code and keeping it healthy

## Why quality is a team matter

PEP 8 starts from one observation: code is read much more often than it is written. Quality
tooling turns taste into rules a machine checks, so reviews can discuss what the code *does*
instead of where the spaces go.

## PEP 8 and PEP 257

**PEP 8** is the style guide for Python code. The rules you meet daily: four-space indentation;
lines of at most 79 characters (teams may agree on up to 99, and many tools default to 88);
`snake_case` for functions and variables, `CapWords` for classes, `UPPER_CASE` for constants, a
leading `_` for internal names; imports at the top, grouped standard library, third party, then
your own; `is None` rather than `== None`; `isinstance()` rather than comparing `type()`;
`startswith()` rather than slicing; and never a bare `except:`.

**PEP 257** covers **docstrings**. Every module, public function, class and method gets one. A
docstring starts with a one-line summary written as a command ("Return the total", not "Returns
the total"), then a blank line and the details: arguments, return value, exceptions, side
effects. A common layout is the Google style:

```python
from decimal import Decimal


def split_fee(total: Decimal, people: int) -> list[Decimal]:
    """Split a fee into equal shares, giving leftover cents to the first shares.

    Args:
        total: The amount to split, with at most two decimal places.
        people: How many shares to make; at least 1.

    Returns:
        One amount per person, summing exactly to ``total``.

    Raises:
        ValueError: If ``people`` is less than 1.
    """
    if people < 1:
        raise ValueError("people must be at least 1")
    cents = int(total * 100)
    share, leftover = divmod(cents, people)
    return [Decimal(share + (i < leftover)) / 100 for i in range(people)]


help(split_fee)
print(split_fee(Decimal("10.00"), 3))
```

```text
Help on function split_fee in module __main__:

split_fee(total: Decimal, people: int) -> list[Decimal]
    Split a fee into equal shares, giving leftover cents to the first shares.

    Args:
        total: The amount to split, with at most two decimal places.
        people: How many shares to make; at least 1.

    Returns:
        One amount per person, summing exactly to ``total``.

    Raises:
        ValueError: If ``people`` is less than 1.

[Decimal('3.34'), Decimal('3.33'), Decimal('3.33')]
```

`help()` and editors show the docstring, and documentation generators such as Sphinx (with its
`napoleon` extension for this style) or MkDocs with mkdocstrings build a reference website from
them. Comments explain *why* a line is the way it is; the docstring explains *what* the function
promises.

## Linters: how they work

A **linter** reads source code without running it and reports likely bugs and style problems.
Most work on the **abstract syntax tree** (AST), the parsed structure of the code, which the
standard library's `ast` module exposes. A few lines show the idea:

```python
import ast

SOURCE = '''
def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags


def load(path):
    """Return the text of PATH."""
    try:
        return open(path).read()
    except:
        return None
'''


class Checker(ast.NodeVisitor):
    def __init__(self):
        self.problems = []

    def report(self, node, message):
        self.problems.append(f"line {node.lineno}: {message}")

    def visit_FunctionDef(self, node):
        if ast.get_docstring(node) is None:
            self.report(node, f"function {node.name!r} has no docstring")
        for default in node.args.defaults:
            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                self.report(default, "mutable default argument")
        self.generic_visit(node)

    def visit_ExceptHandler(self, node):
        if node.type is None:
            self.report(node, "bare 'except:' also catches KeyboardInterrupt")
        self.generic_visit(node)


checker = Checker()
checker.visit(ast.parse(SOURCE))
print("\n".join(checker.problems))
```

```text
line 2: function 'add_tag' has no docstring
line 2: mutable default argument
line 11: bare 'except:' also catches KeyboardInterrupt
```

Real linters have hundreds of such rules, each with a code, and many can fix what they find.

## Ruff: linter and formatter

**Ruff** (from Astral, the makers of uv) is a linter and formatter written in Rust and fast
enough to run on every save. It reimplements the rules of older tools: Pyflakes (`F`, real
errors), pycodestyle (`E`, `W`, style), isort (`I`, import order), pyupgrade (`UP`, newer
syntax), flake8-bugbear (`B`, likely bugs) and many more. Its documentation's tutorial shows a
run on a file with an unused import (newer Ruff shows a code excerpt by default; this is the
short format):

```console
$ ruff check --output-format=concise
src/numbers/calculate.py:3:8: F401 [*] `os` imported but unused
Found 1 error.
[*] 1 fixable with `--fix`.
$ ruff check --fix
Found 1 error (1 fixed, 0 remaining).
$ ruff format
1 file reformatted
```

`ruff check` exits with 1 when it finds violations, which is what makes CI fail. `--fix` applies
only **safe** fixes unless you add `--unsafe-fixes`. `ruff format` is a drop-in replacement for
the Black formatter: it rewrites layout (quotes, wrapping, spacing) to one canonical style so
nobody argues about it, and `ruff format --check` only reports. Configure it in `pyproject.toml`:

```toml
[tool.ruff]
line-length = 88

[tool.ruff.lint]
extend-select = ["I", "UP", "B", "SIM"]
ignore = ["E501"]

[tool.mypy]
strict = true
```

Ruff starts from a curated default rule set; `extend-select` adds rule families and `ignore`
removes single rules. It reads the target Python version from `requires-python`. To silence one
reviewed line, add `# noqa: F401`, always with the code.

## Type checkers in CI

The advanced level showed that type hints are not checked when the program runs. A **type
checker** such as mypy or pyright checks them without running anything:

```console
$ python -m pip install mypy
$ mypy src
src/fees/split.py:24: error: Argument 1 to "split_fee" has incompatible type "float"; expected "Decimal"  [arg-type]
Found 1 error in 1 file (checked 3 source files)
```

The program would have run and returned wrong money. By default mypy skips functions with no
annotations at all; `strict = true` (or `--strict`) turns on the full set of checks, which is
easiest in a new project. For an old one, start lenient and tighten module by module with
`[[tool.mypy.overrides]]` sections.

**Continuous integration** (CI) runs the same commands on every push and pull request, and any
non-zero exit status blocks the merge:

```console
$ ruff check .
$ ruff format --check .
$ mypy src
$ python -m pytest
```

## pre-commit hooks

**pre-commit** runs checks automatically when you `git commit`, so problems never reach CI. The
hooks are listed in `.pre-commit-config.yaml`, each pinned to a version:

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.17.0
    hooks:
      - id: ruff-check
        args: [--fix]
      - id: ruff-format
```

```console
$ pip install pre-commit
$ pre-commit install
pre-commit installed at .git/hooks/pre-commit
$ pre-commit run --all-files
```

A hook that fails or modifies files stops the commit; you look at the change, stage it and commit
again. `pre-commit autoupdate` moves the pinned versions forward.

## Dev mode and warnings

Python's **development mode**, `python -X dev`, turns on extra runtime checks and shows warnings
that are normally hidden, such as `ResourceWarning` for files that were never closed:

```python
def first_line(path):
    return open(path).readline()


with open("notes.txt", "w") as file:
    file.write("hello\n")
print(first_line("notes.txt"), end="")
```

```console
$ python devmode.py
hello
$ python -X dev devmode.py
hello
/tmp/devmode.py:2: ResourceWarning: unclosed file <_io.TextIOWrapper name='notes.txt' mode='r' encoding='utf-8'>
  return open(path).readline()
ResourceWarning: Enable tracemalloc to get the object allocation traceback
```

Run the test suite with `-X dev` or `-W error::DeprecationWarning` in CI, and deprecations surface
while they are still warnings rather than after the upgrade that removes them.

## Reviewing code and keeping it healthy

- **Review for what tools cannot see**: correctness at the edges, good names, a test for the bug
  being fixed. Comment on the code, not the person.
- **Keep changes small.** A 200-line pull request gets a real review; a 2,000-line one gets a
  rubber stamp.
- **Refactor under tests**, and change structure and behaviour in separate commits.
- **Pay down warnings** and update dependencies regularly instead of in one painful jump.

## Common mistakes

- **Formatting by hand in review.** Let `ruff format` decide and spend the review on logic.
- **Blanket `# noqa`** or `# type: ignore` without a code hides future problems on that line too.
- **Turning on every rule at once** in an old codebase, producing thousands of findings nobody
  fixes. Add rule families one at a time.
- **Docstrings that repeat the signature** ("split_fee(total, people)") instead of saying what the
  function promises.

## Practice

1. Which PEP 8 problems are in `def CalcTotal(Items): return sum([i.price for i in Items])`?
2. Write a PEP 257 one-line docstring for a function that tells whether a year is a leap year.
3. Your CI should fail when files are not formatted but must not change them. Which command?

### Answers

1. The function name should be `calc_total` and the parameter `items`; the body belongs on its own
   line; and `sum(item.price for item in items)` needs no list.
2. `"""Return True if year is a leap year in the Gregorian calendar."""`
3. `ruff format --check .`, which exits with 1 when any file would be reformatted.

## Key takeaways

- PEP 8 gives Python a shared style; PEP 257 docstrings start with a one-line command.
- Linters inspect the AST for bugs and style; Ruff lints, fixes and formats from `pyproject.toml`.
- mypy checks annotations statically; strict mode suits new code.
- CI runs lint, format check, types and tests on every change; pre-commit catches them earlier.
- `python -X dev` and `-W error` surface hidden warnings; small reviewed changes keep code healthy.

## Further reading

- [PEP 8: Style Guide for Python Code](https://peps.python.org/pep-0008/)
- [PEP 257: Docstring Conventions](https://peps.python.org/pep-0257/)
- [Ruff tutorial](https://docs.astral.sh/ruff/tutorial/)
- [mypy: Getting started](https://mypy.readthedocs.io/en/stable/getting_started.html)
