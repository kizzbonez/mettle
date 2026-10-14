# shelf_labels: Iterable[str] in, str | None prefix, list[str] out; works on any iterable.
import collections.abc
import inspect
import typing
from typing import get_args, get_origin

hints = typing.get_type_hints(shelf_labels)
assert set(hints) == {"titles", "prefix", "return"}, "shelf_labels should annotate titles, prefix and the return value"
assert get_origin(hints["titles"]) is collections.abc.Iterable, "titles should be an Iterable from collections.abc, not a list"
assert get_args(hints["titles"]) == (str,), "titles should be an Iterable of str"
assert set(get_args(hints["prefix"])) == {str, type(None)}, "prefix should be str | None"
assert get_origin(hints["return"]) is list and get_args(hints["return"]) == (str,), "shelf_labels should return list[str]"
assert inspect.signature(shelf_labels).parameters["prefix"].default is None, "prefix defaults to None"

assert shelf_labels([]) == [] and shelf_labels([], "X") == [], "no titles give no labels"
assert shelf_labels(title.upper() for title in ["kim", "ulysses"]) == ["KIM", "ULYSSES"], "titles can come from a generator"
assert shelf_labels({"Middlemarch": 1}, "Classics") == ["Classics: Middlemarch"], "titles can be any iterable, such as a dict's keys"
assert shelf_labels(["Les Misérables", "Пётр"], "Ω") == ["Ω: Les Misérables", "Ω: Пётр"], "Unicode titles and prefixes are kept as they are"
assert shelf_labels(["Emma"], "") == [": Emma"], "an empty prefix is still a prefix; only None means no prefix"
labels = shelf_labels(("A", "B"))
assert isinstance(labels, list), "shelf_labels returns a list even when given a tuple"
