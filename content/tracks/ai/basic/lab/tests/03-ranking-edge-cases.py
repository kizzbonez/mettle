import copy

articles = [
    {"id": "kb-9", "title": "Long but off topic", "embedding": [50.0, 50.0]},
    {"id": "kb-7", "title": "Duplicate B", "embedding": [0.0, 1.0]},
    {"id": "kb-3", "title": "On topic", "embedding": [0.1, 0.0]},
    {"id": "kb-5", "title": "Duplicate A", "embedding": [0.0, 1.0]},
    {"id": "kb-1", "title": "Opposite", "embedding": [-1.0, 0.0]},
]
before = copy.deepcopy(articles)
query = [1.0, 0.0]

everything = top_k(query, articles, 5)
ids = [article_id for article_id, _ in everything]

assert ids[0] == "kb-3", "a short vector that points the same way as the query should outrank a long vector that does not"
assert ids[1] == "kb-9", "the second-best direction should be ranked second"
assert ids[2:4] == ["kb-5", "kb-7"], "articles with equal scores should be ordered by id, ascending"
assert ids[4] == "kb-1", "an article that points the opposite way should be ranked last"

scores = [score for _, score in everything]
assert scores == sorted(scores, reverse=True), "scores should be in descending order"
assert abs(scores[0] - 1.0) < 1e-9 and abs(scores[4] + 1.0) < 1e-9, "the best and worst scores are wrong"
assert all(isinstance(pair, tuple) and len(pair) == 2 for pair in everything), "each result should be an (id, score) tuple"

assert [i for i, _ in top_k(query, articles, 2)] == ["kb-3", "kb-9"], "k=2 should return only the two best articles"
assert len(top_k(query, articles, 50)) == 5, "k larger than the number of articles should return every article"
assert top_k(query, articles, 0) == [], "k=0 should return an empty list"
assert top_k(query, articles, -3) == [], "a negative k should return an empty list"
assert top_k(query, [], 3) == [], "searching an empty list of articles should return an empty list"

assert articles == before, "top_k must not reorder or modify the articles it is given"

tied = [
    {"id": "kb-20", "title": "Same B", "embedding": [2.0, 2.0]},
    {"id": "kb-10", "title": "Same A", "embedding": [2.0, 2.0]},
    {"id": "kb-30", "title": "Same C", "embedding": [2.0, 2.0]},
]
tied_ids = [article_id for article_id, _ in top_k([1.0, 3.0], tied, 2)]
assert tied_ids == ["kb-10", "kb-20"], "when every score is equal, the lowest ids should be returned first"
