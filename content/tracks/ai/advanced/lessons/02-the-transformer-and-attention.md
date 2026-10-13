---
title: The Transformer and Attention
summary: How attention lets every token draw on the others, why masks and position information are needed, and what a transformer block contains.
minutes: 30
objectives:
  - Compute scaled dot-product attention for small matrices
  - Explain why scores are divided by the square root of the key dimension
  - Explain what a causal mask prevents and how it is applied
  - Name the parts of a transformer block and what each contributes
---

## Outline

1. From tokens to vectors
2. Scaled dot-product attention
3. Masks and heads
4. The transformer block

## From tokens to vectors

Each token id selects a row of an embedding table, which gives one vector per token. Attention
by itself has no sense of order: shuffle the input tokens and the same outputs come back,
shuffled the same way. So **position information** is added to the vectors, or built into the
attention computation.

## Scaled dot-product attention

Each position produces three vectors by multiplying its input by learned matrices: a **query**
(what am I looking for?), a **key** (what do I contain?) and a **value** (what do I pass on?).

```python
scores = q @ k.T / np.sqrt(d_k)       # (T, T): how well each query matches each key
weights = softmax(scores, axis=-1)    # each row is a distribution that sums to 1
out = weights @ v                     # each output is a weighted mix of the values
```

Row `i` of `weights` says how much position `i` takes from every position. Dividing by
`sqrt(d_k)` keeps the scores from growing with the size of the vectors. Without it, large scores
push softmax toward a one-hot output, where gradients are close to zero and learning slows.

## Masks and heads

A language model predicts each token from the tokens before it. In training the whole sequence
is processed at once, so each position must be stopped from seeing later ones. A **causal mask**
sets the scores of future positions to negative infinity before softmax, which makes their
weights exactly zero:

```text
position   may attend to
   0       0
   1       0 1
   2       0 1 2
```

Leave the mask out and the model learns to copy the answer from its input. Training loss looks
excellent and generation fails, because at generation time the future does not exist. The same
mechanism hides padding in a batch of sequences of unequal length.

**Multi-head attention** runs several attention computations in parallel, each on its own slice
of the vector, and concatenates the results. Different heads can track different relationships.

## The transformer block

A block has two sublayers:

1. Multi-head self-attention, which moves information **between** positions.
2. A feed-forward network applied to each position separately, which transforms what was
   gathered.

Each sublayer is wrapped in a **residual connection** (the input is added to the output) and a
normalization layer, which keep gradients stable in deep stacks. A model stacks many such
blocks, then applies a linear layer that turns the final vectors into scores over the
vocabulary.

Attention compares every pair of positions, so its cost grows with the square of the sequence
length.

## Key takeaways

- Attention is a weighted average of values; the weights come from how well queries match keys.
- Scale by `sqrt(d_k)` to keep softmax out of its saturated range.
- The causal mask is what keeps next-token training honest.
- A block is attention plus a feed-forward network, each with a residual connection and
  normalization.
