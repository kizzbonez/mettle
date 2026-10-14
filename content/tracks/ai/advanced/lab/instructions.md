Write `solution.py` with four functions. Inputs are NumPy arrays of floats. In the shapes below,
`...` stands for any number of leading batch dimensions (possibly none), `T` is a sequence
length and `d` is a vector size. A **mask** is a boolean array in which `True` means "this query
may attend to this key".

1. **`softmax(x, axis=-1)`** returns an array of the same shape whose entries along `axis` are
   non-negative and sum to 1.
   - It must not overflow: `softmax(np.array([1000.0, 1000.0]))` is `[0.5, 0.5]`, not `nan`.
   - An entry of `-inf` gets a probability of exactly `0`.

2. **`causal_mask(size)`** returns a boolean array of shape `(size, size)` in which
   `mask[i, j]` is `True` exactly when `j <= i`: position `i` may attend to itself and to earlier
   positions.

3. **`attention(q, k, v, mask=None)`** returns the tuple `(output, weights)`.
   - `q` has shape `(..., T_q, d_k)`, `k` has shape `(..., T_k, d_k)` and `v` has shape
     `(..., T_k, d_v)`.
   - `scores = q · kᵀ / sqrt(d_k)`, where `kᵀ` swaps the last two axes of `k`.
   - `weights = softmax(scores)` over the last axis, with shape `(..., T_q, T_k)`.
   - `output = weights · v`, with shape `(..., T_q, d_v)`.
   - `mask`, when given, broadcasts to `(..., T_q, T_k)`. Where it is `False`, the weight must be
     exactly `0`, and the remaining weights in the row still sum to 1.
   - If a row of the mask is entirely `False`, that query's weights are all `0` and its output
     is all `0`. No `nan` may appear.

4. **`multi_head_attention(x, w_q, w_k, w_v, w_o, num_heads, mask=None)`** returns an array
   with the shape of `x`.
   - `x` has shape `(..., T, d_model)`. Each weight matrix has shape `(d_model, d_model)` and
     multiplies on the right: `q = x @ w_q`, `k = x @ w_k`, `v = x @ w_v`.
   - Let `d_head = d_model // num_heads`. Raise `ValueError` if `d_model` is not divisible by
     `num_heads`.
   - Head `h` (counting from 0) uses columns `h * d_head` up to, but not including,
     `(h + 1) * d_head` of `q`, `k` and `v`. Each head is an independent call of `attention` on
     vectors of size `d_head`.
   - `mask` has shape `(T, T)` or `(..., T, T)`, where `...` are the batch dimensions of `x`.
     The same mask applies to every head.
   - Concatenate the head outputs along the last axis, in head order, to get
     `(..., T, d_model)`. Multiply the result by `w_o` on the right and return it.

Do not modify the arrays you are given.

Example:

```python
q = k = np.array([[1.0, 0.0], [0.0, 1.0]])
v = np.array([[1.0, 2.0], [3.0, 4.0]])
output, weights = attention(q, k, v, mask=causal_mask(2))
```

The scores are `[[0.7071, 0], [0, 0.7071]]`. The mask removes the top-right score, so position
0 can only attend to itself:

```text
weights = [[1.0,    0.0   ],        output = [[1.0,    2.0   ],
           [0.3302, 0.6698]]                  [2.3395, 3.3395]]
```

With two heads, each head sees half of every vector:

```python
x = np.array([[1.0, 0.0, 0.0, 1.0], [0.0, 1.0, 0.0, 1.0]])
eye = np.eye(4)
multi_head_attention(x, eye, eye, eye, 2 * eye, num_heads=2, mask=causal_mask(2))
# [[2.0,    0.0,    0.0, 2.0],
#  [0.6605, 1.3395, 0.0, 2.0]]
```

**Available:** Python 3.15 and NumPy.

**Tips:** `np.swapaxes` and `reshape` work on arrays with any number of leading dimensions;
`.T` reverses all of them. For a mask shaped `(batch, T, T)` to line up with scores shaped
`(batch, heads, T, T)`, it needs one more axis.
