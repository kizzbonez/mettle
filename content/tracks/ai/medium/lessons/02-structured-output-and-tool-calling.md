---
title: Structured Output and Tool Calling
summary: Get output that code can parse, let a model request actions through tools, and validate everything it sends.
minutes: 25
objectives:
  - Explain why free text is a poor interface between a model and a program
  - Describe a tool with a name, a description and a parameter schema
  - Trace one tool call from the model's request to the result it reads
  - Validate model output for shape, value and permission before acting on it
---

## Outline

1. Free text is not an interface
2. Structured output
3. Tool calling: the model asks, your code acts
4. Validate everything

## Free text is not an interface

A program that reads a model's answer needs a predictable shape. "Sure! The order shipped on
Tuesday." is fine for a person and useless for a parser. Asking for a format in prose works
most of the time, and code that works most of the time fails in production.

## Structured output

Describe the output with a **schema**, usually JSON Schema: field names, types, allowed values
and which fields are required. Many model APIs can constrain generation so that the output
always parses and matches the schema. Where that is unavailable, state the schema in the
prompt, parse the reply, and retry on failure.

A schema guarantees shape. It does not guarantee that the values are right.

## Tool calling: the model asks, your code acts

A **tool** is a function you describe to the model:

```json
{
  "name": "get_order_status",
  "description": "Look up the shipping status of one order by its id.",
  "parameters": {
    "type": "object",
    "properties": { "order_id": { "type": "string" } },
    "required": ["order_id"]
  }
}
```

The model never runs anything. The exchange has four steps:

1. You send the conversation and the tool descriptions.
2. The model replies with a **tool call**: a name and arguments.
3. Your code decides whether to run it, runs it, and sends the result back as a message.
4. The model reads the result, then answers or asks for another tool.

The model chooses tools by reading their names and descriptions, so those are prompts too.
Vague or overlapping descriptions cause wrong choices.

## Validate everything

Treat a tool call as untrusted input, as you would a form posted from a browser.

```python
import json

def checked_arguments(raw: str) -> dict:
    args = json.loads(raw)                       # raises if it is not JSON at all
    if not isinstance(args, dict) or set(args) != {"order_id"}:
        raise ValueError("expected exactly one field: order_id")
    if not isinstance(args["order_id"], str):
        raise ValueError("order_id must be a string")
    return args
```

Check three layers:

- **Shape**: does it parse, with the right fields and types?
- **Value**: is the amount within limits, does the id exist?
- **Permission**: may *this user* do this to *this record*? A well-formed request for someone
  else's order is still forbidden.

When a check fails, send the error back to the model as the tool result. It can often correct
itself. Cap the retries, so a confused model cannot loop forever.

## Key takeaways

- Use schemas, not prose, when code will read the output.
- A tool call is a request. Your code decides whether anything happens.
- Tool names and descriptions are prompts; write them with care.
- Validate shape, value and permission, and return errors to the model with a retry limit.
