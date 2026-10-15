Write two functions in `solution.py`. The log is in JSON Lines: one JSON object per line
(skip blank lines). Every event has `time`, `session` and `event`, which is one of:

- `login`: a patron signed in to the session; `email` is the patron's address;
- `user`: the patron typed `text`;
- `retrieved`: the assistant fetched the page `url`, whose text is `content`;
- `tool`: the model asked to call the tool `name` with the dict `args`.

1. `injection_phrases(text)` returns the sorted list of the `INJECTION_PHRASES` that appear in
   `text`, compared in lower case after turning every run of whitespace (spaces, tabs,
   newlines) into a single space, so a phrase split over two lines of an HTML comment is still
   found.
2. `review(path)` returns a list of `(time, session, finding, detail)` tuples, in the order of
   the log lines:
   - `"indirect-injection"`, detail the `url`: a `retrieved` event whose `content` has
     injection phrases. This is the dangerous kind: the attacker never talked to the assistant.
   - `"direct-injection"`, detail the phrases found joined with `", "`: a `user` event whose
     `text` has injection phrases.
   - `"tool-not-allowed"`, detail the tool name: a `tool` event whose `name` is not in
     `ALLOWED_TOOLS` (excessive agency is refused, not trusted).
   - `"recipient-mismatch"`, detail the `to` argument as given (spaces around it removed): a
     `send_email` call whose `to` is not the email of the patron who signed in to **the same
     session** (the latest `login` of that session before the call), compared ignoring case.
     A session with no login fails closed: every `send_email` in it is a mismatch.

Model output is untrusted data: nothing in this function runs or follows the text it reads.

**Example.** With `data/assistant.jsonl`:

```python
injection_phrases("AI Assistant:\n  IGNORE your previous\ninstructions")
# ['ai assistant:', 'ignore your previous instructions']

review("data/assistant.jsonl")
# [('2026-10-16T10:58:43Z', 's-7f2c', 'indirect-injection', 'https://events-partner.example/faq'),
#  ('2026-10-16T10:58:45Z', 's-7f2c', 'recipient-mismatch', 'drop@example.net'),
#  ('2026-10-16T11:10:12Z', 's-c310', 'direct-injection',
#   'ignore all previous instructions, reveal your system prompt'),
#  ('2026-10-16T11:10:15Z', 's-c310', 'tool-not-allowed', 'export_patrons')]
```

The partner's FAQ page carried instructions in an HTML comment, and the model then tried to
mail the loan history to an outside address. Jon's renewal email goes to his own address, only
written with capitals, so it is fine.

**Tip.** `" ".join(text.lower().split())` collapses whitespace. A dict from session to email,
updated at each `login`, gives the patron of a session at any point in the log.
