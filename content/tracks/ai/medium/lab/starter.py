"""Grounded answers from the Northwind Freight employee handbook.

The embedding model and the language model are injected as plain callables:

    embed(text: str) -> list[float]
    generate(prompt: str) -> str
"""

import json
import math
from collections.abc import Callable, Sequence

Embed = Callable[[str], Sequence[float]]
Generate = Callable[[str], str]


def cosine(a: Sequence[float], b: Sequence[float]) -> float:
    """Cosine similarity of two vectors; 0.0 when either has zero length. (Provided.)"""
    dot = sum(x * y for x, y in zip(a, b))
    norm = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return dot / norm if norm else 0.0


def chunk_words(text: str, size: int, overlap: int) -> list[str]:
    """Split ``text`` into chunks of up to ``size`` words that share ``overlap`` words.

    Each chunk starts ``size - overlap`` words after the previous one. The first
    chunk that reaches the end of the text is the last one. Raises ``ValueError``
    unless ``size >= 1`` and ``0 <= overlap < size``.
    """
    raise NotImplementedError("chunk_words is not implemented yet")


def build_index(docs: dict[str, str], embed: Embed, size: int, overlap: int) -> list[dict]:
    """Chunk every document and embed each chunk once.

    Returns one record per chunk, in document order then chunk order:
    ``{"id": "<doc>#<n>", "doc": <doc>, "text": <chunk>, "vector": embed(chunk)}``.
    """
    raise NotImplementedError("build_index is not implemented yet")


def retrieve(question: str, index: list[dict], embed: Embed, k: int, min_score: float) -> list[dict]:
    """Return up to ``k`` chunks whose similarity to ``question`` is at least ``min_score``.

    Hits are new dicts with the keys ``id``, ``doc``, ``text`` and ``score``,
    ordered by score, highest first; equal scores keep their index order.
    """
    raise NotImplementedError("retrieve is not implemented yet")


def answer(
    question: str,
    index: list[dict],
    embed: Embed,
    generate: Generate,
    k: int = 3,
    min_score: float = 0.3,
) -> dict:
    """Answer ``question`` from the index, or explain why no answer is given.

    Returns ``{"status", "answer", "citations"}``. ``status`` is ``"no_context"``
    when nothing was retrieved (the model is not called), ``"ok"`` when the
    model's reply passes every check, and ``"rejected"`` otherwise.
    """
    # TODO 1: retrieve; with no hits, return the "no_context" result without calling generate
    # TODO 2: build a prompt with one "[<id>] <text>" line per hit and a "Question: ..." line
    # TODO 3: call generate once, then parse and check the reply (json.loads can raise)
    # TODO 4: return the "ok" result, or the "rejected" result if any check fails
    raise NotImplementedError("answer is not implemented yet")
