"""Semantic search over help-center articles.

Each article is a dict such as:

    {"id": "kb-101", "title": "Reset your password", "embedding": [0.9, 0.1, 0.0, 0.1]}
"""

import math
from collections.abc import Sequence


def cosine_similarity(a: Sequence[float], b: Sequence[float]) -> float:
    """Return the cosine of the angle between ``a`` and ``b``.

    Returns 0.0 when either vector has zero length. Raises ``ValueError`` when
    the vectors do not have the same number of components.
    """
    if len(a) != len(b):
        raise ValueError(f"vectors have different sizes: {len(a)} and {len(b)}")
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


def top_k(query: Sequence[float], articles: list[dict], k: int) -> list[tuple[str, float]]:
    """Return the ``k`` articles most similar to ``query`` as ``(id, score)`` pairs.

    Pairs are ordered by score, highest first; equal scores are ordered by id,
    ascending. ``k`` larger than the number of articles returns all of them, and
    ``k`` of zero or less returns an empty list. ``articles`` is not modified.
    """
    if k <= 0:
        return []
    scored = [(article["id"], cosine_similarity(query, article["embedding"])) for article in articles]
    scored.sort(key=lambda pair: (-pair[1], pair[0]))
    return scored[:k]
