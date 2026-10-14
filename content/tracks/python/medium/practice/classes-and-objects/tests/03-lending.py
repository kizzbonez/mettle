trimmer = Tool("hedge trimmer", 15)
assert trimmer.is_available() is True, "a new tool is available"

try:
    trimmer.give_back()
except ValueError:
    pass
else:
    raise AssertionError("giving back a tool that is not lent raises ValueError")

trimmer.lend("Ola")
assert trimmer.is_available() is False, "a lent tool is not available"
assert trimmer.borrower == "Ola", "lend sets the borrower"
try:
    trimmer.lend("Ken")
except ValueError:
    pass
else:
    raise AssertionError("lending a tool that is already lent raises ValueError")
assert trimmer.borrower == "Ola" and trimmer.loans == ["Ola"], "a refused loan changes neither borrower nor loans"

assert trimmer.give_back() == "Ola", "give_back returns the person who had the tool"
assert trimmer.borrower is None and trimmer.is_available(), "after give_back nobody has the tool"
for person in ["Ken", "Ola", "Ken"]:
    trimmer.lend(person)
    trimmer.give_back()
assert trimmer.loans == ["Ola", "Ken", "Ola", "Ken"], "loans lists every borrower in order, repeats included"
