# The examples from the instructions. The test calls your functions directly.
assert count_words("Python   is fun\nto learn") == 5, "count_words of the short example text"

post = "word " * 450
assert reading_minutes(post) == 3, "reading_minutes of 450 words at the default 200 words a minute"
assert reading_minutes(post, words_per_minute=300) == 2, "reading_minutes of 450 words at 300 words a minute"
assert reading_minutes("") == 0, "reading_minutes of an empty text"

tags = add_tag("Python")
assert tags == ["python"], "add_tag with no list starts a new one holding the cleaned tag"
add_tag(" Beginners ", tags)
add_tag("python", tags)
assert tags == ["python", "beginners"], "add_tag adds a new tag to the list it is given, but not a tag it already holds"
assert add_tag("news") == ["news"], "a second add_tag call with no list starts a fresh list"

printed = printed_by(print_card, "Hello, loops", post)
expected = "Hello, loops\n450 words, 3 min read\n"
assert printed == expected, f"what print_card prints for the example.\nExpected:\n{expected}\nGot:\n{printed}"
