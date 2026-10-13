"""Semantic search over help-center articles.

Each article is a dict such as:

    {"id": "kb-101", "title": "Reset your password", "embedding": [0.9, 0.1, 0.0, 0.1]}
"""

from collections.abc import Sequence


def cosine_similarity(a: Sequence[float], b: Sequence[float]) -> float:
    """Return the cosine of the angle between ``a`` and ``b``.

    cosine(a, b) = dot(a, b) / (length(a) * length(b))

    Returns 0.0 when either vector has zero length. Raises ``ValueError`` when
    the vectors do not have the same number of components.
    """
    # TODO 1: raise ValueError if the sizes differ
    # TODO 2: compute the dot product and the two lengths
    # TODO 3: return 0.0 if either length is zero, otherwise the cosine
    raise NotImplementedError("cosine_similarity is not implemented yet")


def top_k(query: Sequence[float], articles: list[dict], k: int) -> list[tuple[str, float]]:
    """Return the ``k`` articles most similar to ``query`` as ``(id, score)`` pairs.

    Pairs are ordered by score, highest first; equal scores are ordered by id,
    ascending. ``k`` larger than the number of articles returns all of them, and
    ``k`` of zero or less returns an empty list. ``articles`` is not modified.
    """
    # TODO 4: score every article with cosine_similarity
    # TODO 5: sort by score (descending), then by id (ascending)
    # TODO 6: return at most k pairs
    raise NotImplementedError("top_k is not implemented yet")
