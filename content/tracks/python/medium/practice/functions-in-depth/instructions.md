Write the four functions of `solution.py`. The tests check the parameter lists too (with
`inspect.signature`), so declare them exactly as shown.

1. `link(host, /, *path, secure=True, **query)` returns a web address:
   - `https://` when `secure` is true and `http://` otherwise, then `host`, then `/`;
   - then the `path` parts converted with `str` and joined with `/`;
   - then, only if there are keyword arguments left in `query`, a `?` and each `KEY=VALUE`
     in the order they were passed, joined with `&`.

   `host` is positional-only, so a caller can still pass a query value named `host`; `secure`
   is keyword-only, so a third positional argument is always one more path part.
2. `link_from(parts, options)` receives a list `[host, path part, ...]` and a dict of keyword
   arguments, and returns the link that `link` builds when the list is unpacked into its
   positional arguments and the dict into its keyword arguments.
3. `apply_steps(text, *steps)` calls each function in `steps` in turn, each on the result of
   the one before, starting with `text`, and returns the last result. With no steps it returns
   `text` unchanged.
4. `remember(url, history=None)` appends `url` to the list `history` and returns that list.
   When no `history` is given, it starts a **new** empty list on every call.

Example:

```python
link("library.example", "books", 42, q="tea", page=2)
# 'https://library.example/books/42?q=tea&page=2'
link("library.example")                            # 'https://library.example/'
link("library.example", "events", secure=False)    # 'http://library.example/events'
link("library.example", "search", host="mirror")   # 'https://library.example/search?host=mirror'
link_from(["library.example", "books"], {"secure": False, "q": "jam"})
# 'http://library.example/books?q=jam'
apply_steps("  Summer Reading ", str.strip, str.lower, lambda text: text.replace(" ", "-"))
# 'summer-reading'
remember("a")              # ['a']
remember("b")              # ['b'], not ['a', 'b']
```

**Tips.** `*path` arrives as a tuple and `**query` as a dict, both possibly empty. Pass a
function without calling it: `str.lower`, not `str.lower()`.
