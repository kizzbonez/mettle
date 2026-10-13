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
    """Cosine similarity of two vectors; 0.0 when either has zero length."""
    dot = sum(x * y for x, y in zip(a, b))
    norm = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return dot / norm if norm else 0.0


def chunk_words(text: str, size: int, overlap: int) -> list[str]:
    """Split ``text`` into chunks of up to ``size`` words that share ``overlap`` words.

    Each chunk starts ``size - overlap`` words after the previous one. The first
    chunk that reaches the end of the text is the last one. Raises ``ValueError``
    unless ``size >= 1`` and ``0 <= overlap < size``.
    """
    if size < 1 or overlap < 0 or overlap >= size:
        raise ValueError("need size >= 1 and 0 <= overlap < size")
    words = text.split()
    chunks: list[str] = []
    for start in range(0, len(words), size - overlap):
        chunks.append(" ".join(words[start : start + size]))
        if start + size >= len(words):
            break
    return chunks


def build_index(docs: dict[str, str], embed: Embed, size: int, overlap: int) -> list[dict]:
    """Chunk every document and embed each chunk once.

    Returns one record per chunk, in document order then chunk order:
    ``{"id": "<doc>#<n>", "doc": <doc>, "text": <chunk>, "vector": embed(chunk)}``.
    """
    return [
        {"id": f"{doc_id}#{n}", "doc": doc_id, "text": chunk, "vector": embed(chunk)}
        for doc_id, text in docs.items()
        for n, chunk in enumerate(chunk_words(text, size, overlap))
    ]


def retrieve(question: str, index: list[dict], embed: Embed, k: int, min_score: float) -> list[dict]:
    """Return up to ``k`` chunks whose similarity to ``question`` is at least ``min_score``.

    Hits are new dicts with the keys ``id``, ``doc``, ``text`` and ``score``,
    ordered by score, highest first; equal scores keep their index order.
    """
    query = embed(question)
    hits = []
    for record in index:
        score = cosine(query, record["vector"])
        if score >= min_score:
            hits.append({"id": record["id"], "doc": record["doc"], "text": record["text"], "score": score})
    hits.sort(key=lambda hit: -hit["score"])  # list.sort is stable, so ties keep index order
    return hits[: max(k, 0)]


def _build_prompt(question: str, hits: list[dict]) -> str:
    sources = "\n".join(f"[{hit['id']}] {hit['text']}" for hit in hits)
    return (
        "Answer the question using only the sources below.\n"
        'Reply with a JSON object: {"answer": "<text>", "citations": ["<source id>", ...]}.\n'
        "Cite every source you used. If the sources do not contain the answer, "
        'reply {"answer": null, "citations": []}.\n\n'
        f"Sources:\n{sources}\n\n"
        f"Question: {question}"
    )


def _accepted(reply: str, retrieved_ids: set[str]) -> tuple[str, list[str]] | None:
    """Return ``(answer, citations)`` if the reply is well formed and cites only retrieved chunks."""
    try:
        data = json.loads(reply)
    except (TypeError, ValueError):
        return None
    if not isinstance(data, dict):
        return None
    text, citations = data.get("answer"), data.get("citations")
    if not isinstance(text, str) or not text.strip():
        return None
    if not isinstance(citations, list) or not citations:
        return None
    if not all(isinstance(cited, str) and cited in retrieved_ids for cited in citations):
        return None
    return text, citations


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
    hits = retrieve(question, index, embed, k, min_score)
    if not hits:
        return {"status": "no_context", "answer": None, "citations": []}
    reply = generate(_build_prompt(question, hits))
    accepted = _accepted(reply, {hit["id"] for hit in hits})
    if accepted is None:
        return {"status": "rejected", "answer": None, "citations": []}
    text, citations = accepted
    return {"status": "ok", "answer": text, "citations": citations}
