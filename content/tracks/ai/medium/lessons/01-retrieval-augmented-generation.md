---
title: Retrieval-Augmented Generation
summary: Give a model the right passages at request time, and make it answer from them instead of from memory.
minutes: 25
objectives:
  - Explain which problem retrieval solves and which it does not
  - Choose a chunk size and an overlap and justify the trade-off
  - Describe the query-time pipeline from question to grounded answer
  - Tell a retrieval failure from a generation failure
---

## Outline

1. Why retrieve
2. Indexing: chunk and embed
3. Query time: retrieve and ground
4. Where RAG fails

## Why retrieve

A model's knowledge is frozen when training ends, and it never included your private documents.
Pasting every document into every prompt is slow, costly and soon impossible.
**Retrieval-augmented generation (RAG)** looks up the few passages relevant to a question and
puts only those in the prompt. Updating what the system knows then means updating an index, not
retraining a model.

## Indexing: chunk and embed

Documents are cut into **chunks**. Each chunk is embedded and stored with its source.

- Chunks that are too large blur several topics into one vector and waste the context window.
- Chunks that are too small lose the neighboring sentences that give a fact its meaning.
- **Overlap** repeats the end of one chunk at the start of the next, so a statement that
  straddles a boundary still appears whole somewhere.

Splitting on structure, such as headings and paragraphs, usually beats splitting at a fixed
length. Store the document title and section with each chunk; citations and filters need them.

## Query time: retrieve and ground

```python
def answer(question, index, embed, generate, k=4):
    hits = retrieve(embed(question), index, k)       # top-k chunks by similarity
    if not hits:
        return "I could not find that in the documents."
    sources = "\n".join(f"[{hit['id']}] {hit['text']}" for hit in hits)
    prompt = (
        "Answer using only the sources below, and cite the ids you used.\n"
        "If the sources do not contain the answer, say so.\n\n"
        f"{sources}\n\nQuestion: {question}"
    )
    return generate(prompt)
```

**Grounding** means the answer is tied to the retrieved text. Three things make it hold: an
instruction to use only the sources, a permitted way to say "not found", and citations that
your code checks against the chunks it actually supplied.

## Where RAG fails

- **Retrieval miss.** The right chunk is not in the top k. No prompt can fix this, because the
  model never saw the answer.
- **Split facts.** The answer straddles two chunks, and neither is enough alone.
- **Stale index.** The document changed and the index did not.
- **Ignored context.** The right chunk was retrieved, but the model answered from memory.
- **Conflicting sources.** Two versions of a policy are both retrieved.

Debug in that order. First check whether the right passage was retrieved; only then look at
what the model did with it. Measure the stages separately: retrieval by whether the known source
appears in the top k, generation by whether the answer is supported by the passages supplied.

## Key takeaways

- RAG supplies knowledge at request time; the model's weights stay as they are.
- Chunk size and overlap trade precision against context.
- Ground answers with instructions, a "not found" path and checked citations.
- When an answer is wrong, find out whether retrieval or generation failed before changing
  anything.
