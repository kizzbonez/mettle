import json

# A stand-in for an embedding model: one dimension per keyword, and the value is
# how many times that keyword appears in the text. Real embeddings are learned,
# but they are used in exactly the same way.
KEYWORDS = ["vacation", "days", "carry", "manager", "expense", "receipts", "laptop", "encrypted", "returned", "leaves"]


def embed(text):
    words = [word.strip(".,;:?!'\"").lower() for word in text.split()]
    return [float(words.count(keyword)) for keyword in KEYWORDS]


with open("data/handbook.json", encoding="utf-8") as handle:
    handbook = json.load(handle)

# 1. Chunking
chunks = chunk_words("one two three four five six seven", size=4, overlap=1)
print("chunks:", chunks)
assert chunks == ["one two three four", "four five six seven"], f"wrong chunks for the 7-word example: {chunks}"

# 2. Indexing
index = build_index(handbook, embed, size=20, overlap=5)
ids = [record["id"] for record in index]
print("index ids:", ids)
expected_ids = [f"{doc}#{n}" for doc in ("leave", "expenses", "equipment") for n in range(3)]
assert ids == expected_ids, f"expected the ids {expected_ids}, got {ids}"
assert index[2]["text"].startswith("five unused vacation days carry over"), (
    f"leave#2 should start with the 5 words that end leave#1, got: {index[2]['text']!r}"
)
assert index[2]["vector"] == embed(index[2]["text"]), "each record's vector should be embed(text)"

# 3. Retrieval
question = "How many vacation days carry over?"
hits = retrieve(question, index, embed, k=2, min_score=0.3)
print("hits:", [(hit["id"], round(hit["score"], 4)) for hit in hits])
assert [hit["id"] for hit in hits] == ["leave#2", "leave#1"], "expected leave#2 then leave#1 for the sample question"
assert abs(hits[0]["score"] - 1.0) < 1e-9, f"leave#2 should score 1.0, got {hits[0]['score']!r}"
assert abs(hits[1]["score"] - 0.8660254) < 1e-6, f"leave#1 should score about 0.866, got {hits[1]['score']!r}"


# 4. A grounded answer. This stand-in for the model always gives the same reply.
def generate(prompt):
    print("--- prompt sent to the model ---")
    print(prompt)
    print("--------------------------------")
    return json.dumps({"answer": "Up to five unused vacation days carry over.", "citations": ["leave#2"]})


result = answer(question, index, embed, generate, k=2, min_score=0.3)
print("result:", result)
assert result == {
    "status": "ok",
    "answer": "Up to five unused vacation days carry over.",
    "citations": ["leave#2"],
}, f"a well-formed reply that cites a retrieved chunk should be accepted, got {result}"
