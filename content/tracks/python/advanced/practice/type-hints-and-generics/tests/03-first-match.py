# first_match: a generic function whose annotations all use its own type parameter.
import collections.abc
import typing
from typing import get_args, get_origin

params = getattr(first_match, "__type_params__", ())
assert len(params) == 1, "first_match should declare exactly one type parameter, as in first_match[T]"
T = params[0]
assert isinstance(T, typing.TypeVar), "the type parameter should be a plain one, as in [T]"

hints = typing.get_type_hints(first_match)
assert get_origin(hints.get("items")) is collections.abc.Iterable, "items should be an Iterable from collections.abc"
assert get_args(hints["items"]) == (T,), "items should be an Iterable of the type parameter"
assert get_origin(hints.get("test")) is collections.abc.Callable, "test should be a Callable from collections.abc"
assert get_args(hints["test"]) == ([T], bool), "test should take one T and return a bool"
assert set(get_args(hints.get("return"))) == {T, type(None)}, "first_match should return the type parameter or None"

assert first_match(["Kim", "Emma", "Dune"], lambda t: t.startswith("E")) == "Emma", "first_match finds a string"
assert first_match([5, 0, 7], lambda n: n < 3) == 0, "a falsy item that passes the test is returned, not None"
assert first_match([2, 4, 6], lambda n: n % 2) is None, "None comes back when nothing passes"
assert first_match((n * n for n in range(10)), lambda n: n > 20) == 25, "items can be a generator"
assert first_match([1, 3, 3, 9], lambda n: n == 3) == 3, "the first of several matches is returned"
assert first_match(["x"], lambda item: True) == "x", "a single item can be the match"
