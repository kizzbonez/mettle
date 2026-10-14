**How this lab is judged.** The sandbox has no type checker such as mypy, so the tests check
your annotations at run time: they read them with `typing.get_type_hints`, `typing.get_origin`
and `typing.get_args`, look at the type parameters in `__type_params__`, and also run the code.
Write the annotations exactly as listed, with `Iterable` and `Callable` from `collections.abc`
(the starter imports them) and the type parameter syntax of the lesson. `Optional[str]` counts
the same as `str | None`.

1. `shelf_labels(titles: Iterable[str], prefix: str | None = None) -> list[str]` returns one
   label per title, in order: `f"{prefix}: {title}"`, or just the title when `prefix` is `None`.
2. `first_match[T](items: Iterable[T], test: Callable[[T], bool]) -> T | None` is a generic
   function with one type parameter `T`. It returns the first item for which `test(item)` is
   true, or `None` when there is none.
3. `class Trolley[T]` is a generic class, a stack of items:
   - `__init__(self) -> None` starts it empty;
   - `push(self, item: T) -> None` puts an item on top;
   - `pop(self) -> T` removes and returns the top item, the one pushed last, and raises
     `IndexError` when the trolley is empty;
   - `__len__(self) -> int` is the number of items.
4. `Catalogue` is a type alias for `dict[str, list[str]]`, made with the `type` statement.

Example:

```python
shelf_labels(["Dune", "Emma"], "SF")          # ['SF: Dune', 'SF: Emma']
shelf_labels(("Dune",))                       # ['Dune']
first_match([3, 8, 12], lambda n: n > 5)      # 8
first_match([], lambda n: True)               # None

trolley = Trolley[str]()
trolley.push("Dune")
trolley.push("Emma")
trolley.pop(), len(trolley)                   # ('Emma', 1)

typing.get_type_hints(first_match)
# {'items': collections.abc.Iterable[T], 'test': collections.abc.Callable[[T], bool], 'return': T | None}
Catalogue.__value__                           # dict[str, list[str]]
```
