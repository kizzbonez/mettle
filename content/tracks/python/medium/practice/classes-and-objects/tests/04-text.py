wheelbarrow = Tool("wheelbarrow", 40)
assert str(wheelbarrow) == "wheelbarrow: available", "str of a tool that is not lent"
assert f"{wheelbarrow}" == "wheelbarrow: available", "f-strings use the same text as str"
wheelbarrow.lend("Søren")
assert str(wheelbarrow) == "wheelbarrow: lent to Søren", "str of a lent tool names the borrower"
wheelbarrow.give_back()
assert str(wheelbarrow) == "wheelbarrow: available", "str changes back after give_back"

assert repr(Tool("rake", 7.5)) == "Tool('rake', 7.5)", "repr shows the deposit by its repr, a float included"
assert repr(Tool("kid's saw", 5)) == 'Tool("kid\'s saw", 5)', "repr shows the name by its repr, which picks the quotes"
assert repr(Tool("5", "5")) == "Tool('5', '5')", "repr shows text values in quotes"
lent = Tool("drill", 20)
lent.lend("Ana")
assert repr(lent) == "Tool('drill', 20)", "repr does not change while the tool is lent"
assert str([lent]) == "[Tool('drill', 20)]", "a list of tools shows each tool's repr"
