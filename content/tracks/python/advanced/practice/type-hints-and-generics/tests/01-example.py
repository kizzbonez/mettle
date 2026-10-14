# The library example from the instructions.
import collections.abc
import typing

assert shelf_labels(["Dune", "Emma"], "SF") == ["SF: Dune", "SF: Emma"], "shelf_labels puts the prefix before each title"
assert shelf_labels(("Dune",)) == ["Dune"], "without a prefix the labels are the titles"
assert first_match([3, 8, 12], lambda n: n > 5) == 8, "first_match returns the first item that passes the test"
assert first_match([], lambda n: True) is None, "first_match returns None when no item passes"

trolley = Trolley[str]()
trolley.push("Dune")
trolley.push("Emma")
assert (trolley.pop(), len(trolley)) == ("Emma", 1), "pop returns the item pushed last and len counts what is left"

assert len(getattr(first_match, "__type_params__", ())) == 1, "first_match should declare one type parameter, as in first_match[T]"
T = first_match.__type_params__[0]
hints = typing.get_type_hints(first_match)
assert hints.get("items") == collections.abc.Iterable[T], "items should be annotated Iterable[T]"
assert hints.get("test") == collections.abc.Callable[[T], bool], "test should be annotated Callable[[T], bool]"
assert hints.get("return") == (T | None), "first_match should return T | None"
assert isinstance(Catalogue, typing.TypeAliasType), "Catalogue should be made with a type statement"
assert Catalogue.__value__ == dict[str, list[str]], "Catalogue should stand for dict[str, list[str]]"
