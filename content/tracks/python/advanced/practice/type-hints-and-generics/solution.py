# The library's returns trolley: add type hints and generics.
from collections.abc import Callable, Iterable


def shelf_labels(titles: Iterable[str], prefix: str | None = None) -> list[str]:
    if prefix is None:
        return list(titles)
    return [f"{prefix}: {title}" for title in titles]


def first_match[T](items: Iterable[T], test: Callable[[T], bool]) -> T | None:
    for item in items:
        if test(item):
            return item
    return None


class Trolley[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        if not self._items:
            raise IndexError("the trolley is empty")
        return self._items.pop()

    def __len__(self) -> int:
        return len(self._items)


type Catalogue = dict[str, list[str]]
