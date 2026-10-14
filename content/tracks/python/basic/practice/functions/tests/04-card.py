import contextlib
import io

assert printed_by(print_card, "Notes", "w " * 201) == "Notes\n201 words, 2 min read\n", (
    "print_card prints the title, then the words and the minutes, each on its own line"
)
assert printed_by(print_card, "Haiku", "word") == "Haiku\n1 word, 1 min read\n", "a text of a single word says word, not words"
assert printed_by(print_card, "Draft", "") == "Draft\n0 words, 0 min read\n", "an empty text has 0 words and 0 minutes"
assert printed_by(print_card, "Long read", "w " * 900, words_per_minute=300) == "Long read\n900 words, 3 min read\n", (
    "print_card passes words_per_minute on to the reading time"
)

with contextlib.redirect_stdout(io.StringIO()):
    result = print_card("Quiet", "a b c")
assert result is None, "print_card prints its lines and returns nothing, so the caller gets None"
