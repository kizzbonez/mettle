The sandbox has no network and cannot install anything, so this lab checks the part of pip's
work you can do by hand: reading a requirements file and deciding which versions a specifier
allows. The tests call your three functions with the text of a file and with version strings.

A **version** is whole numbers separated by dots, such as `2.32.3` or `3`. Compare versions as
lists of numbers, never as text (`2.100` is newer than `2.32`), and pad the shorter one with
zeros first, so `3`, `3.0` and `3.0.0` are the same version.

1. `parse_requirements(text)` returns a dict from each requirement's name to its specifier, in
   the order of the file. For each line of `text`:
   - a `#` and everything after it is a comment; drop it, then strip the line. Skip it if
     nothing is left;
   - the **name** is the part before the first of the characters `=<>!~`, stripped and
     lower-cased; the **specifier** is the rest, with every space removed (`""` if there is
     none).
2. `allows(specifier, version)` returns whether `version` satisfies the specifier. An empty
   specifier allows every version. Otherwise it is one or more clauses separated by commas, and
   **every** clause must hold. A clause is one of the forms from the lesson's table:
   - `==V`, `!=V`, `>=V`, `<V`: compare the padded versions;
   - `==V.*`: the version starts with the numbers of `V` (`==2.32.*` allows `2.32` and `2.32.5`,
     not `2.33` and not `2.3`);
   - `~=V`, a compatible release: `>=V`, and the version starts with all the numbers of `V`
     except the last (`~=1.4.2` means `>=1.4.2` and `==1.4.*`).
3. `problems(text, installed)` checks the requirements in `text` against `installed`, a dict
   from lower-case names to installed version strings. It returns a list with, in the order of
   the file, `NAME: not installed` for each requirement missing from `installed`, and
   `NAME: VERSION does not match SPECIFIER` for each one whose installed version is not
   allowed.

Example:

```python
text = """# requirements.txt for the planting planner
requests==2.32.3
NumPy >= 2.0, < 3   # arrays for the harvest charts
rich
"""
parse_requirements(text)   # {'requests': '==2.32.3', 'numpy': '>=2.0,<3', 'rich': ''}
allows(">=2.0,<3", "2.3.1")    # True
allows(">=2.0,<3", "3.0")      # False
allows("~=1.4.2", "1.4.9")     # True
allows("~=1.4.2", "1.5.0")     # False
allows("==2.32.*", "2.32.5")   # True
problems(text, {"requests": "2.31.0", "numpy": "2.3.1"})
# ['requests: 2.31.0 does not match ==2.32.3', 'rich: not installed']
```

**Tips.** Write a helper that turns `"2.32.3"` into `[2, 32, 3]` and another that pads a list
with zeros. Try the two-character operators before `<`. Slicing a padded list, `numbers[:2]`,
gives the numbers a prefix must match.
