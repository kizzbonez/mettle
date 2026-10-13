---
title: "Adapting a Model: Prompting, Retrieval and Fine-Tuning"
summary: Three ways to change what a model does, what fine-tuning and LoRA actually change, and how overfitting and bad data undo the work.
minutes: 30
objectives:
  - Choose between prompting, retrieval and fine-tuning for a stated problem
  - Explain what LoRA trains and why it is cheaper than full fine-tuning
  - Recognize overfitting from training and validation loss
  - List the data problems that degrade a fine-tuned model
---

## Outline

1. Three levers
2. Fine-tuning and LoRA
3. Overfitting
4. Data quality

## Three levers

| Lever       | Changes              | Best for                                                  |
| ----------- | -------------------- | --------------------------------------------------------- |
| Prompting   | The input            | Most problems. Try it first; nothing has to be trained.   |
| Retrieval   | The input, per query | Knowledge that is private or changing; answers with sources. |
| Fine-tuning | The weights          | A consistent style, format or narrow skill.               |

Fine-tuning is a poor way to add facts. Knowledge baked into weights cannot be cited, is hard
to update and harder to remove. Use retrieval for facts and fine-tuning for behavior. The levers
combine: a fine-tuned model can still be given retrieved passages and a careful prompt.

## Fine-tuning and LoRA

**Full fine-tuning** continues training every weight on your examples. It is costly, and each
tuned model is a complete copy.

**LoRA** (low-rank adaptation) freezes the original weights and trains a small correction
beside them. For a weight matrix `W` it learns two narrow matrices whose product has the shape
of `W`:

```python
import numpy as np

d, r, alpha = 1024, 8, 16
rng = np.random.default_rng(0)

W = rng.normal(size=(d, d))            # frozen: 1,048,576 numbers
A = rng.normal(size=(r, d)) * 0.01     # trained
B = np.zeros((d, r))                   # trained; zeros, so the update starts at nothing

W_adapted = W + (alpha / r) * (B @ A)  # 16,384 trained numbers, 1.6% of W
```

The bet is that the change a task needs has low **rank**, so a small `r` captures it. The
adapter is a small file that can be swapped, or merged into `W`.

## Overfitting

A model **overfits** when it memorizes its training examples instead of learning the pattern
behind them. Hold out a validation set that is never trained on, and watch both losses:

```text
epoch  train_loss  val_loss
1      1.92        1.95
2      1.31        1.40
3      0.84        1.22     <- best
4      0.41        1.37
5      0.15        1.71
```

Training loss keeps falling; validation loss turns upward after epoch 3. Stop there (**early
stopping**), add more varied data, or reduce capacity, for example with a lower LoRA rank.

## Data quality

A fine-tuned model reproduces its data, mistakes included.

- **Wrong or inconsistent labels** teach the wrong behavior, or an average of two behaviors.
- **Duplicates** shared by the training and validation sets make validation scores too good to
  be true. This is **leakage**.
- **Narrow data** can erode abilities the model had before. Evaluate on general tasks as well
  as on the target task.

Clean, varied examples are worth more than a larger pile of noisy ones.

## Key takeaways

- Prompt first, retrieve for knowledge, fine-tune for behavior.
- LoRA trains a small low-rank correction beside frozen weights.
- Falling training loss with rising validation loss is overfitting.
- A model can be no better than the examples it is tuned on.
