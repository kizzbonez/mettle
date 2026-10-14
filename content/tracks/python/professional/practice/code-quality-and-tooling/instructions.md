The sandbox has no Ruff, so you write the core of a linter yourself, the way the lesson's
`Checker` does: parse the code with `ast.parse` and walk the tree with an `ast.NodeVisitor`. Write
`lint(source)` in `solution.py`. It takes Python source code as a string (always valid Python)
and returns a list of problems, each a string `line N: CODE MESSAGE`.

1. **N802**: every function, `def` or `async def`, at any depth (methods and nested functions
   too), whose name contains an upper-case letter, gives
   `line N: N802 function name 'NAME' should be lowercase`, where `N` is the line of the `def`.
   Class names are not checked.
2. **E711**: every comparison that uses `==` or `!=` with `None` on either side of that operator,
   such as `x == None` or `None != x`, gives
   `line N: E711 comparison to None should use 'is' or 'is not'`. `N` is the line where the
   comparison starts. A chained comparison (`a < b == None`) is one `ast.Compare` node and gives
   at most one problem; `x is None` and `x == "None"` give none.
3. **`# noqa`**: drop a problem when its line (`source.splitlines()[N - 1]`) contains `# noqa:`
   and the problem's code is among the words after it, which may be separated by commas and
   spaces: `# noqa: E711` and `# noqa: N802, E711` both work. A bare `# noqa` without a colon and
   code drops nothing, and a comment on another line does not count.
4. Return the problems sorted by line, and within one line by column (`node.col_offset`).

**Hints.** Visit `FunctionDef` and `AsyncFunctionDef` (one method can serve both) and `Compare`,
and call `self.generic_visit(node)` in each so nested code is checked too. In an `ast.Compare`,
`node.left` is the first operand, `node.ops` the operators and `node.comparators` the operands
after them, so the operator `node.ops[i]` stands between operand `i` and operand `i + 1` of
`[node.left, *node.comparators]`. `None` is an `ast.Constant` whose `value is None`. Collect
`(line, column, code, message)` tuples, then sort them.

**Example.** `data/adoptions.py`:

```python
class Pet:
    def __init__(self, name, owner=None):
        self.name = name
        self.owner = owner

    def isAdopted(self):
        return self.owner != None


def find_pet(pets, name):
    for pet in pets:
        if pet.name == name or pet.owner == None and name == None:
            return pet
    return None


async def NotifyOwner(pet, mailer):
    if pet.owner == None:  # noqa: E711
        return
    await mailer.send(pet.owner, f"{pet.name} says hello")
```

```python
with open("data/adoptions.py", encoding="utf-8") as file:
    for problem in lint(file.read()):
        print(problem)
```

```text
line 6: N802 function name 'isAdopted' should be lowercase
line 7: E711 comparison to None should use 'is' or 'is not'
line 12: E711 comparison to None should use 'is' or 'is not'
line 12: E711 comparison to None should use 'is' or 'is not'
line 17: N802 function name 'NotifyOwner' should be lowercase
```

Line 12 holds two comparisons with `None`, so it is reported twice. The comparison on line 18 was
reviewed and silenced with `# noqa: E711`.
