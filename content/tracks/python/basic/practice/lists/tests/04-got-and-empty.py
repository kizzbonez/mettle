def shop(*commands):
    ran = run_script(stdin="\n".join(commands) + "\ndone\n")
    assert ran.code == 0, "the script runs to the end without an error"
    return ran.out


ran = run_script(stdin="done\n")
assert ran.code == 0, "the script runs to the end without an error when the first line is done"
assert ran.out == "nothing to buy\n", "a list that never had anything on it"

assert shop("got bread") == "not on the list: bread\nnothing to buy\n", "an item ticked off an empty list is reported"
assert shop("add bread", "got bread") == "nothing to buy\n", "the only item, once bought, leaves nothing to buy"
assert shop("add tea", "add jam", "add rice", "got jam") == "to buy (2): tea, rice\nby name: rice, tea\n", (
    "an item from the middle is removed and the others keep their order"
)
assert shop("add tea", "got tea", "got tea") == "not on the list: tea\nnothing to buy\n", (
    "an item bought twice is reported the second time"
)
assert shop("add tea", "got tea", "add tea") == "to buy (1): tea\nby name: tea\n", (
    "an item that was bought can be added again"
)
assert shop("  add  figs ", "got Figs") == "not on the list: Figs\nto buy (1): figs\nby name: figs\n", (
    "spaces around and inside a command are ignored, and capitals make a different item"
)
