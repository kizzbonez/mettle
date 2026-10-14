import inspect

assert inspect.signature(remember).parameters["history"].default is None, "the default of history is None"

first = remember("https://a.example/")
second = remember("https://b.example/")
assert first == ["https://a.example/"], "remember without a history returns a list with only the url"
assert second == ["https://b.example/"], "a second call without a history starts its own new list"
assert first is not second, "every call without a history makes a new list"
assert remember.__defaults__ == (None,), "calling remember does not change its default"

sent = ["https://old.example/"]
result = remember("https://new.example/", sent)
assert result is sent, "with a history, remember returns that same list"
assert sent == ["https://old.example/", "https://new.example/"], "the url is appended to the end of the given history"
remember("https://newer.example/", history=sent)
assert len(sent) == 3, "history can also be passed by keyword"

empty = []
assert remember("x", empty) is empty and empty == ["x"], "an empty history passed in is used, not replaced"
