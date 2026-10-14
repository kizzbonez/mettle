def shop(*commands):
    ran = run_script(stdin="\n".join(commands) + "\ndone\n")
    assert ran.code == 0, "the script runs to the end without an error"
    return ran.out


assert shop("add rice") == "to buy (1): rice\nby name: rice\n", "a single item added to an empty list"
assert shop("add tea", "add jam", "add apples") == (
    "to buy (3): tea, jam, apples\n"
    "by name: apples, jam, tea\n"
), "added items stay in the order they were added, and the second line lists them sorted"
assert shop("add oats", "add salt", "add oats", "add salt", "add oats") == (
    "already on the list: oats\n"
    "already on the list: salt\n"
    "already on the list: oats\n"
    "to buy (2): oats, salt\n"
    "by name: oats, salt\n"
), "an item already on the list is reported each time and not added again"
assert shop("add tea", "add Tea") == "to buy (2): tea, Tea\nby name: Tea, tea\n", (
    "items are compared exactly as typed, so capitals make a different item, and capitals sort first"
)
