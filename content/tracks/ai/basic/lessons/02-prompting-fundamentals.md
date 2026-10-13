---
title: Prompting Fundamentals
summary: What goes into a prompt, how to structure it, and the failure modes behind most bad answers.
minutes: 20
objectives:
  - Name the parts of an effective prompt and say what each contributes
  - Separate instructions from data with clear delimiters
  - Use examples to pin down a format or a judgment call
  - Diagnose a bad answer as a problem of instruction, context or format
---

## Outline

1. The prompt is all the model has
2. Four parts of a good prompt
3. A structured example
4. Common failure modes

## The prompt is all the model has

A model knows two things: what it absorbed in training, and the text in front of it now. It
cannot see your screen, your database or your intentions. Write a prompt the way you would brief
a capable new colleague who has no background on the task: say what you want, why you want it,
and what a good result looks like.

## Four parts of a good prompt

- **Instructions**: the task, stated directly. "Classify this ticket" beats "What do you think
  about this ticket?"
- **Context**: facts the model needs and cannot know, such as the document to summarize or the
  audience for the answer.
- **Examples**: a few pairs of input and output. They show the format and settle judgment calls
  faster than a description can. This is called few-shot prompting.
- **Output format**: the exact shape you need, such as one label, a list or named fields.

## A structured example

```text
You are triaging support tickets for a billing team.

Classify the ticket inside the <ticket> tags as exactly one of:
refund, invoice, access, other.
If none of the first three fits, answer "other". Do not guess.

Examples:
"I was charged twice in March."        -> refund
"I can't sign in since the update."    -> access

<ticket>
{ticket_text}
</ticket>

Answer with the label only.
```

The tags separate the customer's text from your instructions. The allowed labels are listed,
the examples show two different labels, and the unclear case has a defined answer.

## Common failure modes

- **Vague instructions.** "Make it better" leaves the model to guess what better means. State
  the goal and the constraints.
- **Missing context.** When a needed fact is absent, a model tends to fill the gap with
  something plausible. This is one source of **hallucination**: confident text that is false.
  Supply the facts, and allow the answer "I don't know".
- **Lopsided examples.** Models copy patterns in examples, including accidental ones such as
  length, tone or a label that appears every time.
- **No output format.** If code will read the answer, an unspecified format will eventually
  break that code.
- **Conflicting instructions.** "Be brief" and "explain every step" cannot both be met. The
  model picks one, and not always the same one.
- **Testing on one input.** A prompt that worked once has not been tested. Try it on many varied
  inputs, including awkward ones, before you rely on it.

## Key takeaways

- The model has only its training and the text you send.
- Give instructions, context, examples and an output format.
- Mark the boundary between your instructions and other people's text.
- Allow "I don't know", and test every prompt on many inputs.
