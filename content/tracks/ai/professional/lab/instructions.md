Write `solution.py`. The starter defines the `Tool` dataclass. Keep it as it is and implement:

```python
run_agent(model, tools, task, *, allowed, approve=None, max_steps=6, max_errors=3) -> dict
```

| Argument     | Meaning                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------- |
| `model`      | A callable. It takes the transcript (a list of messages) and returns one reply.          |
| `tools`      | The registry: a dict of tool name to `Tool`. It may hold tools this run must not use.    |
| `task`       | The customer's request, a string.                                                        |
| `allowed`    | The names of the tools this run may use.                                                 |
| `approve`    | A callable `approve(name, args) -> bool` that asks a person, or `None` if nobody can be asked. |
| `max_steps`  | The largest number of model calls.                                                       |
| `max_errors` | How many failed tool calls in a row end the run.                                         |

A model reply is one of these:

```python
{"type": "tool_call", "id": "c1", "name": "lookup_order", "arguments": "{\"order_id\": \"A-1042\"}"}
{"type": "final", "content": "Refund R-1 has been issued."}
```

`arguments` is a **string** that should contain a JSON object. The model wrote it, so it may
contain anything.

### The loop

1. Start the transcript with `{"role": "user", "content": task}`.
2. Call `model(transcript)`. Each call is one step.
3. On a `final` reply, append `{"role": "assistant", "content": <content>}` and stop with the
   status `"completed"`.
4. On a `tool_call` reply, append
   `{"role": "assistant", "tool_call": {"id": <id>, "name": <name>, "arguments": <arguments>}}`
   with the three values exactly as the model sent them. Then append exactly one result:
   `{"role": "tool", "tool_call_id": <id>, "ok": <True or False>, "content": <content>}`.
5. Repeat from step 2 until a stop condition applies.

### The result of a tool call

Apply these checks in order. The first one that fails decides the result: `ok` is `False`, the
content is the error text, later checks are skipped and the tool's function is **not called**.

1. **Allow-list.** The name must be in `allowed` and in `tools`. Otherwise:
   `error: tool not allowed: <name>`
2. **Arguments.** `arguments` must parse as a JSON object whose keys are exactly the keys of
   the tool's `params`, each with a value of the declared type. Otherwise the content starts
   with `error: invalid arguments` (you may add a reason after it).
   - The declared types are `str`, `int`, `float` and `bool`.
   - An `int` is accepted where `float` is declared. Nothing else is converted.
   - A `bool` is never accepted as an `int` or a `float`. Python treats `True` as an `int`;
     JSON does not treat `true` as a number.
3. **Approval.** If the tool is `consequential`, call `approve(name, args)` with the parsed
   arguments. Unless it returns `True`: `error: approval denied`. When `approve` is `None`,
   approval is denied.
4. **Execution.** Call `tool.fn(**args)`. If it raises an `Exception`, the content is
   `error: <exception class name>: <exception message>`, for example
   `error: TimeoutError: order service timed out`. Otherwise `ok` is `True` and the content is
   the value the function returned.

### Stopping

- `"completed"`: the model gave a final reply.
- `"error_limit"`: `max_errors` results in a row had `ok` set to `False`, whatever the reason.
  A successful tool call resets the count. Check this right after appending a result.
- `"step_limit"`: `max_steps` model calls have been made and neither of the above applied. A
  tool call made in the last step is still processed and its result appended.

`run_agent` never raises because of something the model or a tool did.

### Return value

```python
{"status": "completed", "answer": "Refund R-1 has been issued.", "steps": 3, "messages": [...]}
```

`answer` is the content of the final reply, or `None` for the other two statuses. `steps` is the
number of model calls that were made. `messages` is the whole transcript.

### Example

With `lookup_order` and `issue_refund` allowed, an approver that says yes, and a model that
looks up order `A-1042`, refunds it and then answers, the transcript is:

```python
[
    {"role": "user", "content": "Order A-1042 arrived damaged. Please refund it."},
    {"role": "assistant", "tool_call": {"id": "c1", "name": "lookup_order", "arguments": "{\"order_id\": \"A-1042\"}"}},
    {"role": "tool", "tool_call_id": "c1", "ok": True, "content": {"order_id": "A-1042", "status": "delivered", "total": 129.0}},
    {"role": "assistant", "tool_call": {"id": "c2", "name": "issue_refund", "arguments": "{\"order_id\": \"A-1042\", \"amount\": 129.0}"}},
    {"role": "tool", "tool_call_id": "c2", "ok": True, "content": {"refund_id": "R-1", "amount": 129.0}},
    {"role": "assistant", "content": "Refund R-1 for 129.00 has been issued."},
]
```

The status is `"completed"` and `steps` is `3`. If the model had asked for `close_account`
instead, which is registered but not allowed, the result would have been
`{"role": "tool", "tool_call_id": "c2", "ok": False, "content": "error: tool not allowed: close_account"}`
and `close_account` would not have run.

**Available:** Python 3.12 and NumPy. The standard library (`json`) is enough.

**Tip:** `json.loads` returns whatever the text describes. A list, a string and `null` are all
valid JSON, and none of them is a set of arguments.
