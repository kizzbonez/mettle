before = Tool.made
saw = Tool("saw", 12.5)
rake = Tool("rake", 5)
assert (saw.name, saw.deposit, saw.borrower, saw.loans) == ("saw", 12.5, None, []), (
    "a new tool stores name and deposit, has no borrower and an empty list of loans"
)
assert {"name", "deposit", "borrower", "loans"} <= set(vars(saw)), "name, deposit, borrower and loans are instance attributes"
assert saw.loans is not rake.loans, "every tool has its own list of loans"
saw.lend("Ines")
assert rake.loans == [], "lending one tool does not add to another tool's loans"
assert Tool.made == before + 2, "Tool.made goes up by one for every tool created"
Tool("hoe", 3)
assert Tool.made == before + 3, "Tool.made keeps counting"
assert "made" not in vars(saw), "made stays a class attribute, not an instance attribute"
assert saw.made == Tool.made, "a tool reads made from its class"
