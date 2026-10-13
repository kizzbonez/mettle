Write `solution.py` with two functions. Vectors are lists (or tuples) of numbers.

1. `cosine_similarity(a, b)` returns a `float`: the dot product of `a` and `b` divided by the
   product of their lengths.

   ```text
   cosine(a, b) = (a · b) / (|a| × |b|)
   ```

2. If either vector has length zero (every component is `0`), return `0.0`. Do not divide by
   zero.
3. If `a` and `b` have different numbers of components, raise `ValueError`.
4. `top_k(query, articles, k)` returns a list of `(id, score)` tuples. `articles` is a list of
   dicts with the keys `id`, `title` and `embedding`. The score is the cosine similarity
   between `query` and the article's `embedding`.
5. Order the results by score, highest first. When two articles have the same score, order them
   by `id`, ascending.
6. Return at most `k` results. If `k` is larger than the number of articles, return all of
   them. If `k` is `0` or negative, return an empty list.
7. Do not modify `articles` or the dicts inside it.

Example:

```python
cosine_similarity([3.0, 4.0], [4.0, 3.0])   # 24 / (5 × 5) = 0.96
```

For `data/articles.json` and the query vector `[0.8, 0.1, 0.0, 0.3]` (the embedding of
"I can't get into my account"), `top_k(query, articles, 3)` returns these ids and scores,
shown here rounded to four places:

```text
kb-101  0.9697
kb-102  0.9530
kb-401  0.5390
```

Do not round the scores yourself. The tests compare them with a small tolerance.

**Available:** Python 3.12 and NumPy. The standard library is enough for this lab.

**Tip:** sorting by score alone leaves the order of tied articles up to whatever order they
arrived in. Sort on both things you care about.
