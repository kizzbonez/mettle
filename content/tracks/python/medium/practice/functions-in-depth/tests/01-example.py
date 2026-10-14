assert link("library.example", "books", 42, q="tea", page=2) == "https://library.example/books/42?q=tea&page=2", (
    "link('library.example', 'books', 42, q='tea', page=2) from the example"
)
assert link("library.example") == "https://library.example/", "link('library.example') from the example"
assert link("library.example", "events", secure=False) == "http://library.example/events", (
    "link with secure=False from the example"
)
assert link("library.example", "search", host="mirror") == "https://library.example/search?host=mirror", (
    "link with a query value named host, from the example"
)
assert link_from(["library.example", "books"], {"secure": False, "q": "jam"}) == "http://library.example/books?q=jam", (
    "link_from from the example"
)
assert apply_steps("  Summer Reading ", str.strip, str.lower, lambda text: text.replace(" ", "-")) == "summer-reading", (
    "apply_steps from the example"
)
assert remember("a") == ["a"], "remember('a') from the example"
assert remember("b") == ["b"], "remember('b') from the example, after remember('a')"
