assert link_from(["museum.example"], {}) == "https://museum.example/", "link_from with only a host and no options"
assert link_from(["museum.example", "maps", 3], {"zoom": 2}) == "https://museum.example/maps/3?zoom=2", (
    "link_from unpacks every part into positional arguments and every option into keyword arguments"
)
assert link_from(("museum.example", "shop"), {"host": "x", "secure": True}) == "https://museum.example/shop?host=x", (
    "link_from works with a tuple of parts, and an option named host is a query value"
)
parts, options = ["museum.example", "a"], {"q": "b"}
link_from(parts, options)
assert parts == ["museum.example", "a"] and options == {"q": "b"}, "link_from does not change its arguments"

assert apply_steps("Tea") == "Tea", "with no steps, the text comes back unchanged"
assert apply_steps("tea", str.upper) == "TEA", "a single step is applied"
assert apply_steps(" a b ", str.strip, lambda text: text + "!", str.upper) == "A B!", "the steps run in the order given"
assert apply_steps(" a b ", str.upper, lambda text: text + "!", str.strip) == "A B !", "a different order gives a different result"
assert apply_steps(7, lambda n: n * 2, lambda n: n + 1, str) == "15", "each step receives the result of the one before"
