import numpy as np

np.set_printoptions(precision=4, suppress=True)

# softmax
probs = softmax(np.array([1.0, 2.0, 3.0]))
print("softmax([1, 2, 3]) =", probs)
assert np.allclose(probs, [0.09003057, 0.24472847, 0.66524096]), f"softmax([1, 2, 3]) is wrong: {probs}"

big = softmax(np.array([1000.0, 1000.0]))
print("softmax([1000, 1000]) =", big)
assert np.allclose(big, [0.5, 0.5]), f"softmax([1000, 1000]) should be [0.5, 0.5], got {big}"

# causal mask
mask = causal_mask(3)
print("causal_mask(3) =\n", mask)
expected_mask = np.array([[True, False, False], [True, True, False], [True, True, True]])
assert mask.shape == (3, 3) and mask.dtype == bool, "causal_mask(3) should be a 3x3 boolean array"
assert np.array_equal(mask, expected_mask), "causal_mask(3) should be True on and below the diagonal"

# attention with a causal mask
q = k = np.array([[1.0, 0.0], [0.0, 1.0]])
v = np.array([[1.0, 2.0], [3.0, 4.0]])
output, weights = attention(q, k, v, mask=causal_mask(2))
print("weights =\n", weights)
print("output =\n", output)
assert np.allclose(weights, [[1.0, 0.0], [0.33023845, 0.66976155]]), f"wrong weights for the 2x2 example:\n{weights}"
assert np.allclose(output, [[1.0, 2.0], [2.3395231, 3.3395231]]), f"wrong output for the 2x2 example:\n{output}"

# the same example without a mask: position 0 now sees position 1 as well
output, weights = attention(q, k, v)
assert np.allclose(weights, [[0.66976155, 0.33023845], [0.33023845, 0.66976155]]), (
    f"wrong weights for the 2x2 example without a mask:\n{weights}"
)

# two heads, each working on half of every vector
x = np.array([[1.0, 0.0, 0.0, 1.0], [0.0, 1.0, 0.0, 1.0]])
eye = np.eye(4)
merged = multi_head_attention(x, eye, eye, eye, 2 * eye, num_heads=2, mask=causal_mask(2))
print("multi-head output =\n", merged)
assert merged.shape == (2, 4), f"multi_head_attention should return the shape of x, got {merged.shape}"
assert np.allclose(merged, [[2.0, 0.0, 0.0, 2.0], [0.6604769, 1.3395231, 0.0, 2.0]]), (
    f"wrong output for the two-head example:\n{merged}"
)
