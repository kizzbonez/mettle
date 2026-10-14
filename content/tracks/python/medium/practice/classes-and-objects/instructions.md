Write the class `Tool` in `solution.py`.

1. **Attributes.** `Tool(name, deposit)` stores `name` and `deposit` as instance attributes,
   and starts each tool with `borrower` set to `None` and `loans`, a **new empty list of its
   own**, which will hold the name of everyone who ever borrowed it, oldest first.
2. **A counter.** The class attribute `made` starts at `0` and goes up by one each time a `Tool`
   is created. It must stay a class attribute: no tool gets its own `made`.
3. **`lend(person)`** sets `borrower` to `person` and appends `person` to `loans`. If the tool
   is already lent, it raises `ValueError` and changes nothing.
4. **`give_back()`** sets `borrower` back to `None` and returns the person who had the tool. If
   the tool is not lent, it raises `ValueError`.
5. **`is_available()`** returns whether nobody has the tool.
6. **Text.** `repr(tool)` is `Tool(NAME, DEPOSIT)` with both values shown by their own `repr`,
   such as `Tool('ladder', 35)`. `str(tool)` is `NAME: lent to PERSON` while it is lent and
   `NAME: available` otherwise.

Example:

```python
drill = Tool("drill", 20)
ladder = Tool("ladder", 35)
drill.lend("Priya")
print(drill)              # drill: lent to Priya
print([ladder])           # [Tool('ladder', 35)]
drill.give_back()         # 'Priya'
drill.lend("Tom")
drill.loans, ladder.loans # (['Priya', 'Tom'], [])
Tool.made                 # 2
drill.lend("Ana")         # raises ValueError: the drill is with Tom
```

**Tips.** Update the counter through the class name, `Tool.made += 1`: `self.made += 1` would
create an attribute on the instance. A list written in the class body is shared by every tool;
create `loans` in `__init__`.
