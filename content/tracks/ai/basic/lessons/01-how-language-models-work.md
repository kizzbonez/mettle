---
title: How Language Models Work
summary: Training versus inference, tokens, the context window, and how sampling turns probabilities into text.
minutes: 20
objectives:
  - Distinguish training from inference and say what changes in each
  - Explain what a token is and why limits are counted in tokens
  - Describe what the context window holds and what lies outside it
  - Predict how temperature changes a model's output
---

## Outline

1. Learning from examples
2. Training and inference
3. Tokens and the context window
4. Sampling and temperature

## Learning from examples

Traditional software follows rules that a person wrote. A machine learning **model** is a
function with adjustable numbers, called **parameters** or weights. Its rules are found by
adjusting those numbers until the outputs match a large set of examples.

A large language model (LLM) is trained on one task: given some text, predict what comes next.
Doing that well across a huge amount of text forces the model to absorb grammar, facts and
patterns of reasoning. It also means the model produces *plausible* text, which is not always
*true* text.

## Training and inference

- **Training** shows the model examples, measures how wrong its predictions are, and nudges the
  weights to reduce the error. It is slow and expensive, and it is finished before you use the
  model.
- **Inference** runs the finished model on new input. The weights do not change.

A model does not learn from your conversation. It seems to remember earlier messages only
because the application sends them again with every request. What it knows about the world
stops at the point where its training data was collected.

## Tokens and the context window

Models read and write **tokens**: pieces of text that are often a word or part of a word. A
tokenizer might split a sentence like this:

```text
"Unbelievable results!"  ->  ["Un", "believ", "able", " results", "!"]
```

Common words are usually one token. Rare words, names and code are split into several. Limits,
speed and cost are all counted in tokens, not characters.

The **context window** is the largest number of tokens the model can handle in one request,
input and output together. Instructions, documents, conversation history and the answer all
share it. Text that does not fit, or was never sent, does not exist for the model.

## Sampling and temperature

For each next token the model produces a score for every token in its vocabulary. The scores
are turned into probabilities, and one token is picked. **Temperature** reshapes the
probabilities before the pick:

```python
import numpy as np

def next_token_probs(scores, temperature):
    scaled = np.array(scores) / temperature
    exp = np.exp(scaled - scaled.max())
    return exp / exp.sum()

scores = [2.0, 1.0, 0.1]              # three candidate tokens
print(next_token_probs(scores, 1.0))  # about [0.659, 0.242, 0.099]
print(next_token_probs(scores, 0.2))  # about [0.993, 0.007, 0.000]
```

A low temperature concentrates probability on the top choice, so the output is focused and
repeatable. A high temperature flattens the distribution, so the output is more varied and more
likely to wander. Temperature changes how the model chooses among its guesses. It does not make
the guesses more accurate.

## Key takeaways

- Training changes the weights; inference only uses them.
- A model sees only the tokens in the current request.
- Input and output share one context window, measured in tokens.
- Low temperature buys consistency, not correctness.
