drill = Tool("drill", 20)
ladder = Tool("ladder", 35)
drill.lend("Priya")
assert str(drill) == "drill: lent to Priya", "str of the drill lent to Priya, as in the example"
assert repr([ladder]) == "[Tool('ladder', 35)]", "a list holding the ladder shows its repr, as in the example"
assert drill.give_back() == "Priya", "give_back returns Priya, as in the example"
drill.lend("Tom")
assert (drill.loans, ladder.loans) == (["Priya", "Tom"], []), "the loans of both tools, as in the example"
assert Tool.made == 2, "Tool.made after creating two tools, as in the example"
try:
    drill.lend("Ana")
except ValueError:
    pass
else:
    raise AssertionError("lending the drill while Tom has it raises ValueError, as in the example")
