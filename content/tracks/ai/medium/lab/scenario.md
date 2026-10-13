Northwind Freight has 300 employees and one overworked people-operations team. Most of the
questions that team answers are already covered by the employee handbook: how many vacation
days carry over, who approves an expense, what happens to a laptop when someone leaves.

A first prototype of a handbook assistant pasted the entire handbook into every prompt. It was
slow and expensive, and when the handbook said nothing about a topic the assistant invented a
policy anyway. One invented answer about parking permits reached an employee before anyone
noticed.

You are building the replacement. It cuts the handbook into overlapping chunks, finds the few
chunks relevant to a question, and lets the model answer only from those. Every answer must
cite the chunks it relied on, and your code checks the citations instead of taking the model's
word for them. When nothing relevant is found, the assistant says so without asking the model
at all.

The embedding model and the language model are not reachable from this environment, and they
should not be hard-wired into the pipeline anyway. Both are passed in as functions:

```python
embed(text: str) -> list[float]    # the same text always gives the same vector
generate(prompt: str) -> str       # returns the model's reply as text
```

The tests pass in small deterministic stand-ins for both. The handbook is at
`data/handbook.json`, a JSON object that maps a section name to its text.
