# The library's returns trolley: add type hints and generics.
from collections.abc import Callable, Iterable


# 1. Annotate: titles is an Iterable of str, prefix is a str or None, returns a list of str.
def shelf_labels(titles, prefix=None):
    raise NotImplementedError("write shelf_labels")


# 2. Make it generic with a type parameter T: items is an Iterable of T, test takes a T
#    and returns a bool, and the result is a T or None.
def first_match(items, test):
    raise NotImplementedError("write first_match")


# 3. Make the class generic with a type parameter T and annotate every method.
class Trolley:
    def __init__(self):
        raise NotImplementedError("write __init__")

    def push(self, item):
        raise NotImplementedError("write push")

    def pop(self):
        raise NotImplementedError("write pop")

    def __len__(self):
        raise NotImplementedError("write __len__")


# 4. Replace this line with a type statement: Catalogue is dict[str, list[str]].
Catalogue = None
