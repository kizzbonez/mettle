import inspect

kinds = {name: parameter.kind for name, parameter in inspect.signature(link).parameters.items()}
P = inspect.Parameter
assert kinds == {
    "host": P.POSITIONAL_ONLY,
    "path": P.VAR_POSITIONAL,
    "secure": P.KEYWORD_ONLY,
    "query": P.VAR_KEYWORD,
}, "link is declared as link(host, /, *path, secure=True, **query)"
assert inspect.signature(link).parameters["secure"].default is True, "secure defaults to True"

assert link("shop.example", "a", "b", "c") == "https://shop.example/a/b/c", "every positional argument after host is a path part"
assert link("shop.example", "events", True) == "https://shop.example/events/True", (
    "a third positional argument is one more path part, never secure"
)
assert link("shop.example", 2026, 10, 15) == "https://shop.example/2026/10/15", "path parts that are numbers are converted with str"
assert link("shop.example", secure=False) == "http://shop.example/", "with no path, the link ends with /"
assert link("shop.example", "find", z="last", a="first") == "https://shop.example/find?z=last&a=first", (
    "query values keep the order they were passed in"
)
assert link("shop.example", "find", page=1, secure=False, q="tea") == "http://shop.example/find?page=1&q=tea", (
    "secure is never part of the query, wherever it is passed"
)
assert link("shop.example", q="") == "https://shop.example/?q=", "an empty query value is still written"
assert link("shop.example", path="docs") == "https://shop.example/?path=docs", "a keyword argument named path is a query value"

try:
    link(host="shop.example")
except TypeError:
    pass
else:
    raise AssertionError("host cannot be passed by keyword")
