Your team maintains the inference engine that serves your company's language models. It is
fast, heavily optimized and hard to read.

Last week a customer reported that the same prompt produced different completions depending on
what else happened to be in the batch. Two engineers spent three days on it. The cause was a
mask that was broadcast across the wrong axis: some positions could see padding, and a few
could see tokens that came after them. Nothing crashed. The numbers were simply wrong.

The fix has shipped. The review that followed asked for something the team never had: a small
**reference implementation** of the attention layer, written for clarity instead of speed, that
the optimized engine is compared against on every commit.

A reference is only worth having if it is right in the places where the engine went wrong:

- scores so large that a naive softmax overflows;
- masked positions, including a query that is allowed to see nothing at all;
- batches, where a padded sequence must give the same result as the same sequence alone;
- several heads, split and merged in the documented order.

You are writing that reference in NumPy. The attention it implements is the standard one:

```text
weights = softmax(q · kᵀ / sqrt(d_k))      with masked scores set to -inf before the softmax
output  = weights · v
```
