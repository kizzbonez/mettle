Write the four functions in `solution.py`. The tests call them directly with their own
arguments, so keep the names and the parameters exactly as in the starter, defaults included.
Only `print_card` prints; the other three return their result.

1. `count_words(text)` returns the number of words in `text`. Words are separated by any run
   of spaces, tabs or new lines. A text with no words gives `0`.
2. `reading_minutes(text, words_per_minute=200)` returns how many whole minutes it takes to
   read `text`: its words divided by `words_per_minute`, **rounded up**, as an `int`. A text
   with no words takes `0` minutes. Use `count_words`.
3. `add_tag(tag, tags=None)` cleans up `tag` (no spaces around it, all lower case) and adds it
   at the end of the list `tags`, unless the list already holds it. It returns the list. When no
   list is given, it starts a **new** empty list on every such call. When a list is given, it
   changes and returns that same list.
4. `print_card(title, text, words_per_minute=200)` prints two lines: the title, then
   `<words> words, <minutes> min read`, with `word` instead of `words` when there is exactly one.
   It returns nothing.

Example:

```python
count_words("Python   is fun\nto learn")                # 5
reading_minutes("word " * 450)                         # 3: 450 / 200 is 2.25, rounded up
reading_minutes("word " * 450, words_per_minute=300)   # 2
reading_minutes("")                                    # 0
tags = add_tag("Python")                               # ['python']
add_tag(" Beginners ", tags)                           # tags is now ['python', 'beginners']
add_tag("python", tags)                                # unchanged: 'python' is already there
add_tag("news")                                        # ['news'], a new list of its own
print_card("Hello, loops", "word " * 450)
```

The last call prints:

```text
Hello, loops
450 words, 3 min read
```

**Tips.** `math` is imported at the top, and `math.ceil` rounds up. For `add_tag`, remember the
lesson's mutable default trap: `tags=[]` would share one list between calls, which is why the
default is `None` and the function makes the list. Test it with `is None`.
