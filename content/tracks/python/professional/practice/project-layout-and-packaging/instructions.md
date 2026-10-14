The sandbox has no network and no build tools, so this lab checks the part of packaging that
plain Python can check: the contents of `pyproject.toml` and version specifiers. The tests read
each file with `tomllib` (lesson 3 shows it) and pass you the resulting `dict`, so
`project["project"]["name"]` is the project's name. Write three functions in `solution.py`.

1. `version_tuple(text)` returns a release version as a tuple of integers: `"1.10.0"` gives
   `(1, 10, 0)` and `"2"` gives `(2,)`. Split at the dots; every part must be non-empty and made
   only of the digits 0 to 9. Raise `ValueError` for anything else, such as `""`, `"1..0"`,
   `"1.5.0rc1"` or `"1.-2"`. (`int()` alone accepts `"-2"` and `" 2"`, so check the digits first.)
2. `allows(specifier, version)` returns `True` when the release `version` satisfies one
   specifier clause, such as `">= 1.4"` or `"~=1.4.2"`, and `False` otherwise.
   - The clause is an operator, `~=`, `>=`, `<=`, `==`, `!=`, `>` or `<`, then a version. Spaces
     around the operator and the version are allowed. Any other start raises `ValueError`.
   - Compare the two versions as tuples, after padding the shorter one with zeros, so `1.4` and
     `1.4.0` are equal.
   - `~= V` means "`>= V`, and the same leading parts as `V` except its last": `~= 1.4.2` accepts
     `1.4.9` but not `1.5.0`, and `~= 2.2` accepts `2.9` but not `3.0`. `V` needs at least two
     parts; `~= 2` raises `ValueError`.
3. `problems(project)` checks the parsed file and returns a list of messages, in this order:
   - `"no build backend"` when there is no `"build-system"` table or it has no `"build-backend"`;
   - `"no name"` when the `"project"` table is missing or has no `"name"`;
   - `"bad version 'TEXT'"` when the version is not a plain release (one that `version_tuple`
     rejects), or `"no version"` when there is no `"version"` and `"version"` is not listed in
     `"dynamic"`;
   - `"pinned dependency 'TEXT'"` for each entry of `"dependencies"`, in order, whose requirement
     part (the text before any `;`) contains `==`, because a library should not pin;
   - `"bad script 'NAME'"` for each entry of `[project.scripts]`, in order, whose value is not an
     object reference `module:function`: exactly one `:`, with text on both sides of it.

   `TEXT` and `NAME` are the values exactly as they are written in the file, between single
   quotes: `f"bad script '{name}'"`. A file with no problems gives `[]`.

**Example.** `data/birdcount.toml`:

```toml
[build-system]
requires = ["hatchling >= 1.26"]
build-backend = "hatchling.build"

[project]
name = "birdcount"
version = "0.3.1"
description = "Count the birds seen on a club walk"
requires-python = ">= 3.13"
dependencies = [
    "rich >= 13",
    "click == 8.1.7",
    "colorama >= 0.4; os_name == 'nt'",
]

[project.scripts]
birdcount = "birdcount.cli:main"
birdcount-report = "birdcount.report.main"
```

```python
with open("data/birdcount.toml", "rb") as file:
    project = tomllib.load(file)
problems(project)        # ["pinned dependency 'click == 8.1.7'", "bad script 'birdcount-report'"]
version_tuple("1.10.0")  # (1, 10, 0)
allows(">= 1.4", "1.10.0")    # True: (1, 10, 0) >= (1, 4, 0), while "1.10.0" >= "1.4" is False
allows("~= 1.4.2", "1.5.0")   # False
allows("== 1.4", "1.4.0")     # True
```

The `==` after `;` in the colorama line belongs to the platform marker, not to the version, so
that line is fine.

**Tip.** Look for the two-character operators before `>` and `<`, or `">= 1.4"` is read as `>`
followed by the version `"= 1.4"`. Use `.get()` with a default for tables and keys that may be
missing.
