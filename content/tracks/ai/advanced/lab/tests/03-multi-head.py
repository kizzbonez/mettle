import numpy as np

rng = np.random.default_rng(11)


def allowed_mask(size):
    """The causal mask, built here so that these checks do not depend on causal_mask."""
    return np.tril(np.ones((size, size), dtype=bool))


def slow_multi_head(x, w_q, w_k, w_v, w_o, num_heads, mask=None):
    """Multi-head attention for one sequence, written as plain loops."""
    T, d_model = x.shape
    d_head = d_model // num_heads
    q, k, v = x @ w_q, x @ w_k, x @ w_v
    merged = np.zeros((T, d_model))
    for h in range(num_heads):
        cols = slice(h * d_head, (h + 1) * d_head)
        for i in range(T):
            allowed = [j for j in range(T) if mask is None or mask[i, j]]
            scores = np.array([q[i, cols] @ k[j, cols] for j in allowed]) / np.sqrt(d_head)
            weights = np.exp(scores - scores.max())
            weights /= weights.sum()
            for weight, j in zip(weights, allowed):
                merged[i, cols] += weight * v[j, cols]
    return merged @ w_o


T, d_model = 5, 8
x = rng.normal(size=(T, d_model))
w_q, w_k, w_v, w_o = (rng.normal(size=(d_model, d_model)) for _ in range(4))
eye = np.eye(d_model)
x_before, w_o_before = x.copy(), w_o.copy()

# --- one head is plain attention ----------------------------------------------------

expected, _ = attention(x, x, x, mask=allowed_mask(T))
one_head = multi_head_attention(x, eye, eye, eye, eye, num_heads=1, mask=allowed_mask(T))
assert one_head.shape == (T, d_model), "the output should have the shape of x"
assert np.allclose(one_head, expected), "one head with identity matrices should equal attention(x, x, x)"

projected = multi_head_attention(x, w_q, w_k, w_v, w_o, num_heads=1)
assert np.allclose(projected, attention(x @ w_q, x @ w_k, x @ w_v)[0] @ w_o), (
    "one head should equal attention on the projected q, k and v, multiplied by w_o"
)

# --- several heads, checked against the slow loop -----------------------------------

for num_heads in (1, 2, 4, 8):
    for mask in (None, allowed_mask(T)):
        label = f"num_heads={num_heads}, {'causal mask' if mask is not None else 'no mask'}"
        actual = multi_head_attention(x, w_q, w_k, w_v, w_o, num_heads=num_heads, mask=mask)
        assert actual.shape == (T, d_model), f"{label}: the output should have the shape of x"
        assert np.allclose(actual, slow_multi_head(x, w_q, w_k, w_v, w_o, num_heads, mask)), (
            f"{label}: the output differs from a loop over heads (check the columns each head uses, "
            "the scaling inside a head, the order the heads are joined in, and w_o)"
        )

two = multi_head_attention(x, w_q, w_k, w_v, w_o, num_heads=2)
four = multi_head_attention(x, w_q, w_k, w_v, w_o, num_heads=4)
assert not np.allclose(two, four), "changing the number of heads should change the result"

# --- batches --------------------------------------------------------------------------

batch = rng.normal(size=(3, T, d_model))
out = multi_head_attention(batch, w_q, w_k, w_v, w_o, num_heads=4, mask=allowed_mask(T))
assert out.shape == (3, T, d_model), "a batch should keep its leading dimension"
for b in range(3):
    assert np.allclose(out[b], slow_multi_head(batch[b], w_q, w_k, w_v, w_o, 4, allowed_mask(T))), (
        "with a (T, T) mask, each sequence in a batch should give the same result as that sequence alone"
    )

lengths = [5, 3, 2]
real = np.array([[j < n for j in range(T)] for n in lengths])
per_sequence_mask = allowed_mask(T) & real[:, np.newaxis, :]  # (batch, T, T)
out = multi_head_attention(batch, w_q, w_k, w_v, w_o, num_heads=2, mask=per_sequence_mask)
for b, n in enumerate(lengths):
    alone = slow_multi_head(batch[b, :n], w_q, w_k, w_v, w_o, 2, allowed_mask(n))
    assert np.allclose(out[b, :n], alone), (
        "with a (batch, T, T) mask, a padded sequence should give the same outputs as the same sequence without padding"
    )

nested = rng.normal(size=(2, 3, T, d_model))
out = multi_head_attention(nested, w_q, w_k, w_v, w_o, num_heads=2, mask=allowed_mask(T))
assert out.shape == (2, 3, T, d_model), "two leading batch dimensions should both be kept"
assert np.allclose(out[1, 2], slow_multi_head(nested[1, 2], w_q, w_k, w_v, w_o, 2, allowed_mask(T))), (
    "with two leading batch dimensions, each sequence should give the same result as that sequence alone"
)

# --- causality survives the head split ------------------------------------------------

changed = x.copy()
changed[3:] = rng.normal(size=(T - 3, d_model))
before = multi_head_attention(x, w_q, w_k, w_v, w_o, num_heads=4, mask=allowed_mask(T))
after = multi_head_attention(changed, w_q, w_k, w_v, w_o, num_heads=4, mask=allowed_mask(T))
assert np.allclose(before[:3], after[:3]), "changing later tokens changed the output at earlier positions: the mask leaks"

# --- argument checks -------------------------------------------------------------------

try:
    multi_head_attention(x, w_q, w_k, w_v, w_o, num_heads=3)
except ValueError:
    pass
else:
    raise AssertionError("multi_head_attention should raise ValueError when d_model is not divisible by num_heads")

assert np.array_equal(x, x_before) and np.array_equal(w_o, w_o_before), "multi_head_attention must not modify its inputs"
