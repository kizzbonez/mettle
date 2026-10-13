---
title: "Operating AI Systems: Latency, Cost and Quality"
summary: Where latency and cost come from, what caching can and cannot do, what to trace, and how to gate releases on regression evaluations.
minutes: 30
objectives:
  - Identify the main drivers of latency and cost in an LLM request
  - Choose a cache key that keeps a response cache correct
  - Specify what a trace must record for a failure to be replayed
  - Design a regression evaluation gate that tolerates noise
---

## Outline

1. Latency and cost
2. Caching and routing
3. Observability
4. Regression evaluations in CI

## Latency and cost

Cost follows tokens: every input token and every output token is paid for. Latency is the time
to the first token plus the time to generate the rest, one token after another, so long answers
are slow answers.

Agents multiply both. Each step sends the growing history again, so a task of twenty steps pays
for its first messages twenty times.

The levers are shorter prompts, shorter outputs, fewer steps, and independent calls made in
parallel. **Streaming** does not shorten the total time, but it shows the user progress sooner.

## Caching and routing

- A **response cache** returns a stored answer for an identical request. It is correct only if
  the key covers everything the answer depends on: the model and its settings, the prompt
  version, the retrieved documents or their index version, and the user's permissions. Leave
  one out and you serve stale answers, or one user's answer to another.
- **Prompt caching**, where a platform offers it, reuses the processing of a repeated prefix.
  Put stable content first and changing content last.
- A **semantic cache** matches similar questions instead of identical ones. Similar is not the
  same: "refund order 12" and "refund order 21" are close in meaning and need different
  answers.
- **Routing** sends easy requests to a smaller, cheaper model. Evaluate the router too; it can
  be wrong.

## Observability

A model system fails quietly: it returns a fluent, well-formed, wrong answer with a success
status, and no uptime dashboard shows it. Record a **trace** for every request:

```json
{
  "trace_id": "t-81f2",
  "step": 3,
  "kind": "model_call",
  "prompt_version": "support-v14",
  "model_version": "pinned-2",
  "input_tokens": 2310,
  "output_tokens": 148,
  "latency_ms": 1840,
  "cache_hit": false
}
```

Store the input and output of every model call and tool call as well, with personal data
redacted, so that a bad answer can be replayed. Watch quality signals next to system metrics:
user feedback, fallback rates, guardrail triggers, and scores from evaluating a sample of live
traffic.

## Regression evaluations in CI

Prompts, tool descriptions and model versions are code. Version them, and run the evaluation
set on every change.

```python
def gate(baseline: float, candidate: float, margin: float) -> bool:
    """Pass unless the candidate is worse than the baseline by more than the margin."""
    return candidate >= baseline - margin
```

Evaluation scores are noisy, so compare against a fixed baseline with a margin measured from
repeated runs. Pin the model version: a model that changes underneath you is a change nobody
reviewed. Evaluate a new version before adopting it, and add every production failure to the
set.

## Key takeaways

- Tokens drive cost; output length and step count drive latency.
- A cache is only as correct as its key.
- Trace every step with its versions, so failures can be replayed.
- Gate changes on evaluations, with a margin that reflects their noise.
