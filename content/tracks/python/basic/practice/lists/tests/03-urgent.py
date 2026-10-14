def to_buy(*commands):
    ran = run_script(stdin="\n".join(commands) + "\ndone\n")
    assert ran.code == 0, "the script runs to the end without an error"
    lines = ran.out.split("\n")
    assert len(lines) >= 3, "a list with items in it ends with the two lines that show them"
    return lines[-3]


assert to_buy("urgent soap") == "to buy (1): soap", "an urgent item on an empty list"
assert to_buy("add tea", "add jam", "urgent soap") == "to buy (3): soap, tea, jam", "a new urgent item goes in front of the others"
assert to_buy("add tea", "add jam", "add rice", "urgent jam") == "to buy (3): jam, tea, rice", (
    "an urgent item already on the list moves to the front and is not listed twice"
)
assert to_buy("add tea", "add jam", "urgent tea") == "to buy (2): tea, jam", "an urgent item that is already first stays where it is"
assert to_buy("add tea", "urgent jam", "urgent soap", "add milk") == "to buy (4): soap, jam, tea, milk", (
    "the latest urgent item is the first, and items added later still go to the end"
)

ran = run_script(stdin="add tea\nadd jam\nurgent jam\nadd jam\ndone\n")
assert ran.out.startswith("already on the list: jam\n"), "an item moved to the front is still on the list for add"
