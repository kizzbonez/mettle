first = add_tag("travel")
second = add_tag("food")
assert first == ["travel"], "a call with no list returns a list holding only its own tag"
assert second == ["food"], "every call with no list starts a new empty list, not one shared with an earlier call"
assert first is not second, "two calls with no list return two different lists"

mine = ["recipes"]
returned = add_tag("Baking", mine)
assert mine == ["recipes", "baking"], "the list passed in is changed: the tag is added at its end"
assert returned is mine, "add_tag returns the very list it was given, not a copy"

assert add_tag("  BAKING  ", mine) == ["recipes", "baking"], "a tag already in the list, once cleaned up, is not added twice"
assert add_tag("Éclairs", mine) == ["recipes", "baking", "éclairs"], "accented letters are lowered like any other"

empty = []
assert add_tag("x", empty) is empty and empty == ["x"], "an empty list that is passed in is used, not replaced by a new one"
