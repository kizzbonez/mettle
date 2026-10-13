Write `solution.py`. The starter gives you a working `cosine(a, b)`. Implement the four
functions below. `embed` and `generate` are supplied by the caller; in production each call
costs time and money, so never call them more often than a step requires.

1. **`chunk_words(text, size, overlap)`** returns a list of strings.
   - Split `text` on whitespace into words. A chunk is up to `size` consecutive words joined by
     single spaces.
   - The first chunk starts at word 0. Each later chunk starts `size - overlap` words after the
     one before it, so neighboring chunks share `overlap` words.
   - The first chunk that reaches the end of the text is the last one. It may be shorter than
     `size`. Never add a chunk whose words are all in the chunk before it.
   - Text with no words gives `[]`.
   - Raise `ValueError` unless `size >= 1` and `0 <= overlap < size`.

2. **`build_index(docs, embed, size, overlap)`** returns a list of records.
   - `docs` maps a document id to its text. Keep the documents in the order of the dict, and
     each document's chunks in order.
   - Make one record per chunk, where `n` counts that document's chunks from 0:
     `{"id": "<doc id>#<n>", "doc": "<doc id>", "text": <chunk>, "vector": embed(<chunk>)}`
   - Call `embed` exactly once per chunk.

3. **`retrieve(question, index, embed, k, min_score)`** returns a list of hits.
   - Call `embed` exactly once, on the question. Use the vectors stored in the index.
   - Score each record with `cosine`. Keep the records whose score is `>= min_score`.
   - Order them by score, highest first. Records with equal scores stay in index order.
   - Return at most `k` hits; `k <= 0` gives `[]`.
   - Each hit is a **new** dict with the keys `id`, `doc`, `text` and `score`. Do not modify
     the index.

4. **`answer(question, index, embed, generate, k=3, min_score=0.3)`** returns a dict with the
   keys `status`, `answer` and `citations`.
   - Retrieve with the given `k` and `min_score`.
   - If nothing is retrieved, return
     `{"status": "no_context", "answer": None, "citations": []}` and do **not** call `generate`.
   - Otherwise call `generate(prompt)` exactly once. The prompt must contain one line per hit,
     in rank order, in the form `[<id>] <text>`, and the line `Question: <question>`. It must
     not contain any chunk that was not retrieved. Around those lines, tell the model to use
     only the sources and to reply with a JSON object of the form
     `{"answer": "<text>", "citations": ["<id>", ...]}`. That wording is yours.
   - Accept the reply only if **all** of these hold:
     - it parses as a JSON object;
     - `answer` is a string, and not empty or only whitespace;
     - `citations` is a non-empty list;
     - every citation is the `id` of a hit that you put in the prompt.
   - If the reply is accepted, return
     `{"status": "ok", "answer": <answer>, "citations": <citations>}`.
   - Otherwise return `{"status": "rejected", "answer": None, "citations": []}`. A bad reply
     must never raise an exception. A model that declines to answer also ends up here, and the
     application shows the same fallback message in both cases.

Example:

```python
chunk_words("one two three four five six seven", size=4, overlap=1)
# ["one two three four", "four five six seven"]
```

The second chunk reaches the end of the text, so it is the last. A third chunk starting at
`seven` would repeat a word the reader already has.

With `data/handbook.json`, `size=20`, `overlap=5` and the keyword-counting `embed` from the
visible test, the index holds nine chunks, `leave#0` to `equipment#2`. For the question
`"How many vacation days carry over?"` with `k=2` and `min_score=0.3`, `retrieve` returns
`leave#2` (score 1.0) and then `leave#1` (about 0.866).

**Available:** Python 3.12 and NumPy. The standard library (`json`, `math`) is enough.

**Tip:** `json.loads` raises on malformed input, and it returns whatever the text describes: a
list, a number or `null` are all valid JSON. Check what you got before you index into it.
