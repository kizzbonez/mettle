import json

with open("data/articles.json", encoding="utf-8") as handle:
    articles = json.load(handle)

score = cosine_similarity([3.0, 4.0], [4.0, 3.0])
assert abs(score - 0.96) < 1e-9, f"cosine_similarity([3, 4], [4, 3]) should be 0.96, got {score!r}"

query = [0.8, 0.1, 0.0, 0.3]  # the embedding of "I can't get into my account"
results = top_k(query, articles, 3)
print("top_k returned:", results)

assert len(results) == 3, f"top_k(query, articles, 3) should return 3 results, got {len(results)}"

ids = [article_id for article_id, _ in results]
assert ids == ["kb-101", "kb-102", "kb-401"], f"expected kb-101, kb-102, kb-401 in that order, got {ids}"

expected_scores = [0.9697, 0.9530, 0.5390]
for (article_id, actual), expected in zip(results, expected_scores):
    assert abs(actual - expected) < 5e-5, f"score for {article_id} should be about {expected}, got {actual!r}"
