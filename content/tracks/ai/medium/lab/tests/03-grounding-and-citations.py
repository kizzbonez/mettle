import json

KEYWORDS = ["vacation", "days", "carry", "manager", "expense", "receipts", "laptop", "encrypted", "returned", "leaves"]


def embed(text):
    words = [word.strip(".,;:?!'\"").lower() for word in text.split()]
    return [float(words.count(keyword)) for keyword in KEYWORDS]


class FakeModel:
    """Returns one canned reply and records every prompt it is given."""

    def __init__(self, reply):
        self.reply = reply
        self.prompts = []

    def __call__(self, prompt):
        self.prompts.append(prompt)
        return self.reply


with open("data/handbook.json", encoding="utf-8") as handle:
    handbook = json.load(handle)

index = build_index(handbook, embed, size=20, overlap=5)
NO_CONTEXT = {"status": "no_context", "answer": None, "citations": []}
REJECTED = {"status": "rejected", "answer": None, "citations": []}

# --- Nothing relevant in the handbook: the model must not be asked ----------------

model = FakeModel(json.dumps({"answer": "Bicycles go in the basement.", "citations": ["leave#0"]}))
result = answer("Where can I park my bicycle?", index, embed, model)
assert model.prompts == [], "when nothing is retrieved, generate must not be called"
assert result == NO_CONTEXT, "when nothing is retrieved, the result should be the no_context result"

model = FakeModel(json.dumps({"answer": "Yes.", "citations": ["equipment#0"]}))
result = answer("Must the laptop be encrypted?", index, embed, model, k=3, min_score=0.99)
assert model.prompts == [] and result == NO_CONTEXT, "answer should pass min_score on to retrieval"

# --- A good reply, using the default k and min_score ------------------------------

question = "Must the laptop be encrypted?"
good = {"answer": "Yes. It must be encrypted, and locked when unattended.", "citations": ["equipment#0"]}
model = FakeModel(json.dumps(good))
result = answer(question, index, embed, model)
assert result == {"status": "ok", **good}, "a well-formed reply that cites a retrieved chunk should be accepted unchanged"
assert len(model.prompts) == 1, "generate should be called exactly once for a question that has sources"

retrieved = ["equipment#0", "equipment#1"]
by_id = {record["id"]: record for record in index}
lines = model.prompts[0].splitlines()
positions = []
for chunk_id in retrieved:
    line = f"[{chunk_id}] {by_id[chunk_id]['text']}"
    assert line in lines, "the prompt should have one line per retrieved chunk in the form [id] text"
    positions.append(lines.index(line))
assert positions == sorted(positions), "retrieved chunks should appear in the prompt in rank order"
assert f"Question: {question}" in lines, "the prompt should contain the line 'Question: <question>'"
for record in index:
    if record["id"] not in retrieved:
        assert record["text"] not in model.prompts[0], "the prompt should not contain chunks that were not retrieved"

both = {"answer": "Encrypted, and returned to the IT desk on the last day.", "citations": ["equipment#1", "equipment#0"]}
assert answer(question, index, embed, FakeModel(json.dumps(both))) == {"status": "ok", **both}, (
    "a reply that cites several retrieved chunks should be accepted"
)

# --- Replies that must be rejected ------------------------------------------------

bad_replies = {
    "a reply that is not JSON": "Yes, the laptop must be encrypted. Source: equipment#0",
    "an empty reply": "",
    "a JSON reply that is a list, not an object": json.dumps(["equipment#0"]),
    "a JSON reply that is null": "null",
    "a reply with no citations field": json.dumps({"answer": "Yes."}),
    "a reply with no answer field": json.dumps({"citations": ["equipment#0"]}),
    "a reply with an empty list of citations": json.dumps({"answer": "Yes.", "citations": []}),
    "a reply whose citations field is a string": json.dumps({"answer": "Yes.", "citations": "equipment#0"}),
    "a reply whose answer is only whitespace": json.dumps({"answer": "  \n", "citations": ["equipment#0"]}),
    "a reply whose answer is null": json.dumps({"answer": None, "citations": ["equipment#0"]}),
    "a reply that cites a chunk from the index that was not retrieved": json.dumps(
        {"answer": "Yes.", "citations": ["equipment#0", "leave#0"]}
    ),
    "a reply that cites an id that does not exist": json.dumps({"answer": "Yes.", "citations": ["handbook#7"]}),
    "a reply whose citations are objects instead of ids": json.dumps(
        {"answer": "Yes.", "citations": [{"id": "equipment#0"}]}
    ),
}
for description, reply in bad_replies.items():
    model = FakeModel(reply)
    try:
        result = answer(question, index, embed, model)
    except Exception as error:
        raise AssertionError(f"{description} should be rejected, but answer raised {type(error).__name__}") from None
    assert result == REJECTED, f"{description} should give the rejected result"
    assert len(model.prompts) == 1, "generate should be called exactly once, even when its reply is rejected"

# --- Citations are checked against what was actually sent -------------------------

second_best = {"answer": "It goes back to the IT desk.", "citations": ["equipment#1"]}
assert answer(question, index, embed, FakeModel(json.dumps(second_best)), k=2)["status"] == "ok", (
    "with k=2 the second-ranked chunk is in the prompt, so citing it should be accepted"
)
model = FakeModel(json.dumps(second_best))
result = answer(question, index, embed, model, k=1)
assert result == REJECTED, "with k=1 only the best chunk is in the prompt, so citing the second-ranked chunk should be rejected"
assert sum(line.startswith("[equipment#") for line in model.prompts[0].splitlines()) == 1, (
    "answer should pass k on to retrieval"
)
