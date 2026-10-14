# Reading Time
#
# The tests call the four functions below directly.

import math


def count_words(text):
    """Return the number of words in text, separated by any whitespace."""
    return len(text.split())


def reading_minutes(text, words_per_minute=200):
    """Return the whole minutes it takes to read text, rounded up."""
    return math.ceil(count_words(text) / words_per_minute)


def add_tag(tag, tags=None):
    """Add tag, cleaned up, to the list tags unless it is there already, and return the list."""
    if tags is None:
        tags = []
    tag = tag.strip().lower()
    if tag not in tags:
        tags.append(tag)
    return tags


def print_card(title, text, words_per_minute=200):
    """Print the title, then a line with the words and the minutes it takes to read text."""
    words = count_words(text)
    minutes = reading_minutes(text, words_per_minute)
    label = "word" if words == 1 else "words"
    print(title)
    print(f"{words} {label}, {minutes} min read")
