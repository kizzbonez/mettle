import numpy as np

rng = np.random.default_rng(7)


def allowed_mask(size):
    """The causal mask, built here so that the attention checks do not depend on causal_mask."""
    return np.tril(np.ones((size, size), dtype=bool))


# --- causal_mask -----------------------------------------------------------------

for size in (1, 4, 7):
    made = causal_mask(size)
    assert isinstance(made, np.ndarray) and made.dtype == bool, "causal_mask should return a boolean NumPy array"
    assert made.shape == (size, size), "causal_mask(size) should have the shape (size, size)"
    assert np.array_equal(made, allowed_mask(size)), "causal_mask should allow each position itself and earlier positions only"

# --- softmax ---------------------------------------------------------------------

huge = softmax(np.array([1000.0, 1000.0, 1000.0, 1000.0]))
assert np.all(np.isfinite(huge)), "softmax must stay finite for very large scores"
assert np.allclose(huge, 0.25), "softmax of four equal, very large scores is wrong"

tiny = softmax(np.array([-1000.0, -1001.0]))
assert np.all(np.isfinite(tiny)), "softmax must stay finite for very negative scores"
assert np.allclose(tiny, [0.73105858, 0.26894142]), "softmax of two very negative scores is wrong"

table = rng.normal(size=(3, 4))
plain = np.exp(table)
assert np.allclose(softmax(table), plain / plain.sum(axis=1, keepdims=True)), (
    "softmax should normalize along the last axis by default"
)
assert np.allclose(softmax(table, axis=0), plain / plain.sum(axis=0, keepdims=True)), (
    "softmax should normalize along the axis it is given"
)
assert softmax(table, axis=0).shape == (3, 4), "softmax should keep the shape of its input"
assert np.allclose(softmax(table + 500.0), softmax(table)), "adding a constant to every score should not change softmax"

holes = softmax(np.array([0.0, -np.inf, 0.0]))
assert holes[1] == 0.0, "an entry of -inf should get a probability of exactly 0"
assert np.allclose(holes, [0.5, 0.0, 0.5]), "the finite entries should share the probability when one entry is -inf"

# --- attention without a mask, checked against a slow loop -------------------------

T, d_k, d_v = 6, 8, 3
q = rng.normal(size=(T, d_k))
k = rng.normal(size=(T, d_k))
v = rng.normal(size=(T, d_v))
q_before, k_before, v_before = q.copy(), k.copy(), v.copy()

scores = np.array([[q[i] @ k[j] for j in range(T)] for i in range(T)]) / np.sqrt(d_k)
slow_weights = np.exp(scores) / np.exp(scores).sum(axis=1, keepdims=True)

output, weights = attention(q, k, v)
assert weights.shape == (T, T), "weights should have the shape (T_q, T_k)"
assert output.shape == (T, d_v), "output should have the shape (T_q, d_v), also when d_v differs from d_k"
assert np.allclose(weights, slow_weights), "weights without a mask are wrong: check how the scores are scaled"
assert np.allclose(output, slow_weights @ v), "output should be the weights applied to the values"

output, weights = attention(q[:2], k, v)
assert weights.shape == (2, T) and output.shape == (2, d_v), "attention should allow fewer queries than keys"
assert np.allclose(weights, slow_weights[:2]), "weights are wrong when there are fewer queries than keys"

# --- causal mask -------------------------------------------------------------------

output, weights = attention(q, k, v, mask=allowed_mask(T))
assert np.all(weights[np.triu_indices(T, k=1)] == 0.0), "with a causal mask, every later position should have a weight of exactly 0"
assert np.allclose(weights.sum(axis=-1), 1.0), "with a causal mask, each row of weights should still sum to 1"
assert np.allclose(weights[0], np.eye(T)[0]), "with a causal mask, position 0 can only attend to itself"
assert np.allclose(output[0], v[0]), "with a causal mask, the output at position 0 should be the value at position 0"

x = rng.normal(size=(T, d_k))
changed = x.copy()
changed[4:] = rng.normal(size=(T - 4, d_k))
before, _ = attention(x, x, x, mask=allowed_mask(T))
after, _ = attention(changed, changed, changed, mask=allowed_mask(T))
assert np.allclose(before[:4], after[:4]), "changing later tokens changed the output at earlier positions: the mask leaks"
assert not np.allclose(before[4:], after[4:]), "changing a token should change the output at its own position"

# --- batches and padding -----------------------------------------------------------

batch = rng.normal(size=(3, T, d_k))
batch_output, batch_weights = attention(batch, batch, batch, mask=allowed_mask(T))
assert batch_output.shape == (3, T, d_k) and batch_weights.shape == (3, T, T), "a batch should keep its leading dimension"
for b in range(3):
    single_output, single_weights = attention(batch[b], batch[b], batch[b], mask=allowed_mask(T))
    assert np.allclose(batch_weights[b], single_weights) and np.allclose(batch_output[b], single_output), (
        "each sequence in a batch should give the same result as that sequence alone"
    )

lengths = [6, 4, 2]
real = np.array([[j < n for j in range(T)] for n in lengths])  # (batch, T): True for real tokens
padded_mask = allowed_mask(T) & real[:, np.newaxis, :]  # (batch, T, T)
padded_output, padded_weights = attention(batch, batch, batch, mask=padded_mask)
for b, n in enumerate(lengths):
    assert np.all(padded_weights[b][:, n:] == 0.0), "padding positions should receive a weight of exactly 0"
    alone, _ = attention(batch[b, :n], batch[b, :n], batch[b, :n], mask=allowed_mask(n))
    assert np.allclose(padded_output[b, :n], alone), (
        "a padded sequence in a batch should give the same outputs as the same sequence without padding"
    )

# --- a query that may attend to nothing --------------------------------------------

blocked = np.array([[True, False, False], [False, False, False], [True, True, True]])
small_q = rng.normal(size=(3, 4))
small_v = rng.normal(size=(3, 2))
with np.errstate(all="ignore"):
    output, weights = attention(small_q, small_q, small_v, mask=blocked)
assert np.all(np.isfinite(weights)) and np.all(np.isfinite(output)), "a fully masked row must not produce nan or inf"
assert np.all(weights[1] == 0.0), "a query that may attend to nothing should have all-zero weights"
assert np.all(output[1] == 0.0), "a query that may attend to nothing should have an all-zero output"
assert np.allclose(weights[0], [1.0, 0.0, 0.0]), "a fully masked row should not disturb the other rows"
assert np.allclose(weights[2].sum(), 1.0) and np.all(weights[2] > 0.0), "an unmasked row should still be a full distribution"

assert np.array_equal(q, q_before) and np.array_equal(k, k_before) and np.array_equal(v, v_before), (
    "attention must not modify its inputs"
)
