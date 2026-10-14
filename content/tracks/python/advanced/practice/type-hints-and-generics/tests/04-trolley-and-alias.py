# Trolley[T]: a generic stack with annotated methods; Catalogue: a type alias.
import typing

params = getattr(Trolley, "__type_params__", ())
assert len(params) == 1, "Trolley should declare exactly one type parameter, as in class Trolley[T]"
T = params[0]
assert typing.get_type_hints(Trolley.__init__) == {"return": type(None)}, "__init__ should be annotated -> None"
assert typing.get_type_hints(Trolley.push) == {"item": T, "return": type(None)}, "push should take item: T and return None"
assert typing.get_type_hints(Trolley.pop) == {"return": T}, "pop should return T"
assert typing.get_type_hints(Trolley.__len__) == {"return": int}, "__len__ should return int"

books = Trolley[str]()
assert len(books) == 0, "a new trolley is empty"
for title in ["Kim", "Emma", "Dune"]:
    books.push(title)
assert len(books) == 3, "len counts the pushed items"
assert [books.pop(), books.pop(), books.pop()] == ["Dune", "Emma", "Kim"], "pop returns the items in reverse order of pushing"
try:
    books.pop()
except IndexError:
    pass
else:
    raise AssertionError("pop on an empty trolley should raise IndexError")

numbers, words = Trolley[int](), Trolley()
numbers.push(7)
assert len(words) == 0, "each trolley has its own items"
words.push(None)
assert words.pop() is None and len(words) == 0, "any item can be pushed and popped back"

assert isinstance(Catalogue, typing.TypeAliasType), "Catalogue should be made with a type statement"
assert Catalogue.__name__ == "Catalogue", "the alias should be named Catalogue"
assert Catalogue.__value__ == dict[str, list[str]], "Catalogue should stand for dict[str, list[str]]"
