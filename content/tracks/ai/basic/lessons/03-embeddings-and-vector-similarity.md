---
title: Embeddings and Vector Similarity
summary: How text becomes a vector, how cosine similarity compares two vectors, and how that becomes search by meaning.
minutes: 25
objectives:
  - Explain what an embedding represents
  - Compute cosine similarity by hand for small vectors
  - Describe top-k semantic search and how it differs from keyword search
  - State when similarity scores can and cannot be compared
---

## Outline

1. Text as a point in space
2. Cosine similarity
3. Semantic search
4. Limits and pitfalls

## Text as a point in space

An **embedding model** turns a piece of text into a fixed-length list of numbers: a vector,
also called an **embedding**. The model is trained so that texts with similar meaning get
vectors that point in similar directions. "How do I reset my password?" and "I can't sign in"
share almost no words, yet their embeddings land close together.

The individual numbers have no readable meaning. Only the geometry matters: which vectors are
near which.

## Cosine similarity

The usual measure of closeness is **cosine similarity**, the cosine of the angle between two
vectors:

```text
cosine(a, b) = (a · b) / (|a| × |b|)
```

`a · b` is the dot product: multiply matching components and add the results. `|a|` is the
length of `a`: the square root of the sum of its squared components. The score runs from 1
(same direction) through 0 (at right angles, unrelated) to -1 (opposite).

```python
import numpy as np

a = np.array([1.0, 2.0, 0.0])
b = np.array([2.0, 1.0, 0.0])

dot = a @ b                                            # 1*2 + 2*1 + 0*0 = 4
score = dot / (np.linalg.norm(a) * np.linalg.norm(b))  # 4 / (2.236 * 2.236)
print(round(float(score), 3))                          # 0.8
```

Because the dot product is divided by both lengths, only direction counts. Doubling every
component of `b` leaves the score unchanged. A vector of all zeros has no direction, so code
must handle that case instead of dividing by zero.

## Semantic search

Search by meaning takes three steps:

1. **Index**: embed every document once and store the vectors.
2. **Query**: embed the user's question with the same model.
3. **Rank**: score every document against the query and return the `k` best, the **top-k**.

Keyword search finds documents that contain the query's words. Semantic search finds documents
about the same thing, even when the wording differs. Many systems combine the two, because
embeddings are weakest on exact terms such as product codes.

## Limits and pitfalls

- **Same model on both sides.** Vectors from two different embedding models live in unrelated
  spaces. If you change the model, embed every document again.
- **Similar is not correct.** "How to cancel a refund" sits close to "How to get a refund".
  Similarity measures topic, not truth or usefulness.
- **Top-k always returns k results.** If nothing relevant exists, you still get the least
  irrelevant items. Use a minimum score to reject weak matches.
- **Thresholds do not transfer.** A cutoff tuned for one model and data set is wrong for
  another.

## Key takeaways

- An embedding places text in a space where direction carries meaning.
- Cosine similarity compares direction and ignores length.
- Semantic search is embed, score, rank, return the top k.
- Use one embedding model throughout, and never read a high score as proof of relevance.
