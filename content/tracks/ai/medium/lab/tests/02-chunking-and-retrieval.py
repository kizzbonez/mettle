import copy

# --- chunk_words ---------------------------------------------------------------

ten = " ".join(f"w{i}" for i in range(10))
assert chunk_words(ten, 4, 2) == ["w0 w1 w2 w3", "w2 w3 w4 w5", "w4 w5 w6 w7", "w6 w7 w8 w9"], (
    "10 words with size 4 and overlap 2: check how far each chunk moves and where the last chunk ends"
)
assert chunk_words("a b c", 5, 2) == ["a b c"], "a text shorter than one chunk should give exactly one chunk"
assert chunk_words("a b c d", 4, 1) == ["a b c d"], "a text of exactly `size` words should give exactly one chunk"
assert chunk_words("a b c d e", 2, 0) == ["a b", "c d", "e"], (
    "with overlap 0, chunks should share no words and the last one may be shorter"
)
assert chunk_words("  a\n\nb\tc  ", 2, 0) == ["a b", "c"], (
    "words are separated by any whitespace and joined with single spaces"
)
assert chunk_words("", 3, 1) == [], "an empty text should give an empty list"
assert chunk_words(" \n\t ", 3, 1) == [], "a text of only whitespace should give an empty list"

words = [f"t{i}" for i in range(53)]
for size, overlap in [(7, 3), (10, 1), (5, 4), (53, 10), (60, 0), (1, 0)]:
    label = f"size={size}, overlap={overlap}, 53 words"
    chunks = [chunk.split() for chunk in chunk_words(" ".join(words), size, overlap)]
    assert chunks, f"{label}: expected at least one chunk"
    assert all(len(chunk) == size for chunk in chunks[:-1]), f"{label}: every chunk but the last should have `size` words"
    assert 1 <= len(chunks[-1]) <= size, f"{label}: the last chunk should have between 1 and `size` words"
    for left, right in zip(chunks, chunks[1:]):
        assert left[size - overlap :] == right[:overlap], f"{label}: neighboring chunks should share exactly `overlap` words"
    covered = chunks[0] + [word for chunk in chunks[1:] for word in chunk[overlap:]]
    assert covered == words, f"{label}: together the chunks should cover every word, in order"
    reached_end = [chunk[-1] == words[-1] for chunk in chunks]
    assert reached_end.count(True) == 1 and reached_end[-1], (
        f"{label}: the first chunk that reaches the end of the text should be the last chunk"
    )

for size, overlap in [(0, 0), (-2, 0), (4, -1), (4, 4), (4, 9)]:
    try:
        chunk_words("a b c d e f", size, overlap)
    except ValueError:
        continue
    raise AssertionError(f"chunk_words should raise ValueError for size={size}, overlap={overlap}")

# --- build_index ---------------------------------------------------------------

calls = []


def embed(text):
    calls.append(text)
    return [1.0, 0.0]


docs = {"zeta": "a b c d e f g", "alpha": "h i j", "blank": "   "}
built = build_index(docs, embed, 4, 1)
assert [record["id"] for record in built] == ["zeta#0", "zeta#1", "alpha#0"], (
    "ids should follow the order of the dict, number each document's chunks from 0, and skip documents with no words"
)
assert [record["doc"] for record in built] == ["zeta", "zeta", "alpha"], "each record should name its document in `doc`"
assert [record["text"] for record in built] == ["a b c d", "d e f g", "h i j"], "each record should hold its chunk in `text`"
assert all(record["vector"] == [1.0, 0.0] for record in built), "each record should hold embed(chunk) in `vector`"
assert calls == ["a b c d", "d e f g", "h i j"], "build_index should call embed exactly once per chunk, in order"

# --- retrieve ------------------------------------------------------------------

index = [
    {"id": "a#0", "doc": "a", "text": "north", "vector": [0.0, 3.0]},
    {"id": "d#0", "doc": "d", "text": "east", "vector": [2.0, 0.0]},
    {"id": "b#0", "doc": "b", "text": "west", "vector": [-1.0, 0.0]},
    {"id": "b#1", "doc": "b", "text": "east again", "vector": [5.0, 0.0]},
    {"id": "c#0", "doc": "c", "text": "blank", "vector": [0.0, 0.0]},
    {"id": "c#1", "doc": "c", "text": "north-east", "vector": [3.0, 4.0]},
]
snapshot = copy.deepcopy(index)

calls.clear()
hits = retrieve("which way?", index, embed, k=10, min_score=0.0)
assert calls == ["which way?"], (
    "retrieve should call embed exactly once, on the question, and reuse the vectors stored in the index"
)
assert [hit["id"] for hit in hits] == ["d#0", "b#1", "c#1", "a#0", "c#0"], (
    "hits should be ordered by score with ties in index order; a score equal to min_score is kept, a lower one is dropped"
)
assert all({"id", "doc", "text", "score"} <= set(hit) for hit in hits), "each hit needs the keys id, doc, text and score"
assert abs(hits[2]["score"] - 0.6) < 1e-9, "a hit's score should be the cosine similarity to the question"
assert (hits[0]["doc"], hits[0]["text"]) == ("d", "east"), "a hit should carry the doc and text of its record"
assert index == snapshot, "retrieve must not modify the index"
assert all(hit is not record for hit in hits for record in index), "each hit should be a new dict, not a record from the index"

assert [hit["id"] for hit in retrieve("which way?", index, embed, k=2, min_score=0.0)] == ["d#0", "b#1"], (
    "k=2 should return only the two best hits"
)
assert [hit["id"] for hit in retrieve("which way?", index, embed, k=5, min_score=0.9)] == ["d#0", "b#1"], (
    "min_score should remove weak matches even when fewer than k remain"
)
assert retrieve("which way?", index, embed, k=0, min_score=0.0) == [], "k=0 should return an empty list"
assert retrieve("which way?", index, embed, k=-1, min_score=0.0) == [], "a negative k should return an empty list"
assert retrieve("which way?", [], embed, k=3, min_score=0.0) == [], "an empty index should return an empty list"
assert index == snapshot, "retrieve must not modify the index"
