---
title: Agents and Orchestration
summary: The tool loop at the center of every agent, the state it carries, the conditions that stop it, and when a fixed workflow is the better design.
minutes: 30
objectives:
  - Implement the basic agent loop and say what each iteration adds to the state
  - Choose stop conditions and budgets for an agent
  - Explain why per-step reliability compounds over a long task
  - Decide between a fixed workflow and an agent for a given task
---

## Outline

1. The tool loop
2. State and context
3. Stop conditions
4. Workflow or agent

## The tool loop

An **agent** is a model that runs in a loop and chooses its own next action. On each turn the
model either asks for a tool or gives a final answer. Your code runs the tool and appends the
result, and the model is called again with the longer history.

```python
def run(model, tools, task, max_steps=8):
    messages = [{"role": "user", "content": task}]
    for _ in range(max_steps):
        reply = model(messages)
        messages.append(reply)
        if reply["type"] == "final":
            return "completed", reply["content"]
        result = execute(tools, reply)           # validate, run, catch errors
        messages.append({"role": "tool", "content": result})
    return "step_limit", None
```

## State and context

The model is stateless. The agent's whole memory is the message list, plus whatever your code
stores elsewhere.

- The history grows with every step, and every step sends all of it again. Long tasks overflow
  the context window and cost more per step as they go. Summarize or drop old tool results, and
  keep durable facts (a plan, a to-do list, results so far) in storage the agent can read back.
- If state lives only in memory, a crash loses the run. Persist it at each step when a task
  must be resumable.

## Stop conditions

A loop that ends only when the model says so will one day not end. Give every agent several
exits:

- a **final answer**;
- a **step limit**, and a token or cost budget;
- a **time limit**;
- a limit on **consecutive failures**;
- detection of **no progress**, such as the same call repeated with the same arguments.

Tool errors are observations, not crashes. Return the error text to the model so it can try
another approach, and count it against the failure limit. When a limit is hit, return a partial
result with a clear status, never an invented answer.

## Workflow or agent

Reliability compounds. If each step is right 95% of the time, ten dependent steps all succeed
about 60% of the time (0.95 to the tenth power). Fewer model decisions mean fewer chances to go
wrong.

- Use a **workflow** when the steps are known in advance: code fixes the sequence, and the
  model does one bounded job at each step. It is cheaper, faster and testable stage by stage.
- Use an **agent** when the path cannot be known ahead of time, as in debugging or open-ended
  research.
- Add checks between steps, so that errors are caught where they happen.

Several agents add coordination cost and new ways to fail. Split work only for a specific
reason, such as a separate context for independent subtasks.

## Key takeaways

- An agent is a loop: model, tool, result, repeat.
- The message list is the state. Manage its growth and persist what matters.
- Every agent needs limits on steps, cost, time and repeated failure.
- Prefer the simplest structure that solves the task.
