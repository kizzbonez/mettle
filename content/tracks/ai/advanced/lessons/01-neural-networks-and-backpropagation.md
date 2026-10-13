---
title: Neural Networks and Backpropagation
summary: What a layer computes, how a loss measures error, and how the chain rule turns that error into an update for every weight.
minutes: 30
objectives:
  - Describe a layer as a linear map followed by a nonlinearity, and say why the nonlinearity is required
  - Explain what a cross-entropy loss rewards and punishes
  - Apply the chain rule to derive the gradient for a weight
  - Predict the effect of a learning rate that is too high or too low
---

## Outline

1. Layers and nonlinearity
2. The loss
3. Backpropagation
4. Gradient descent

## Layers and nonlinearity

A layer multiplies its input by a weight matrix, adds a bias, and applies a simple nonlinear
function such as ReLU, `max(0, x)`:

```text
h = relu(x · W1 + b1)       hidden layer
y = h · W2 + b2             output scores (logits)
```

The nonlinearity is essential. Two linear layers in a row compute `x · W1 · W2`, which is the
same as one layer with the matrix `W1 · W2`. Without something nonlinear between them, depth
adds nothing.

## The loss

Training needs one number that says how wrong the network is. For classification that is
usually **cross-entropy**: turn the logits into probabilities with softmax, then take the
negative log of the probability given to the correct class. A confident correct prediction
costs almost nothing. A confident wrong one costs a lot.

## Backpropagation

To improve, we need the **gradient**: how the loss changes when each weight changes.
Backpropagation is the chain rule applied from the loss backwards through the layers, reusing
each intermediate result. One backward pass yields every gradient for roughly the cost of one
forward pass.

For logistic regression, a one-layer network, it fits in a few lines:

```python
import numpy as np

def train_step(w, b, x, y, lr):
    z = x @ w + b                         # forward: scores, shape (n,)
    p = 1 / (1 + np.exp(-z))              # forward: probabilities
    loss = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
    dz = (p - y) / len(y)                 # backward: d loss / d z
    grad_w = x.T @ dz                     # chain rule: d z / d w is x
    grad_b = dz.sum()
    return w - lr * grad_w, b - lr * grad_b, loss
```

The derivative of the loss with respect to each score is `p - y`, the prediction minus the
target, divided by the batch size. A deeper network repeats the pattern, passing the gradient
back through one layer at a time.

## Gradient descent

Each step moves every weight a little against its gradient: `w = w - lr * grad`. The **learning
rate** `lr` sets the size of the step.

- Too high: the loss jumps around or diverges.
- Too low: training crawls and may stall.

In practice the gradient is estimated on a small random **batch** of examples, which is noisy
but cheap. Two problems grow with depth: gradients that shrink toward zero on the way back
(**vanishing**) and gradients that grow without limit (**exploding**). Residual connections and
normalization layers exist largely to keep gradients well behaved in deep networks.

## Key takeaways

- A layer is a linear map plus a nonlinearity. Without the nonlinearity, depth is useless.
- The loss reduces "how wrong" to one number that can be differentiated.
- Backpropagation is the chain rule, run backwards and organized to reuse work.
- When training misbehaves, check the learning rate first.
