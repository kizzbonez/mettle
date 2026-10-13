"""A reference implementation of attention, written for clarity rather than speed.

Shapes use ``...`` for any number of leading batch dimensions, ``T`` for the
sequence length and ``d`` for a vector size. A mask is a boolean array in which
``True`` means "this query may attend to this key".
"""

import numpy as np


def softmax(x: np.ndarray, axis: int = -1) -> np.ndarray:
    """Return the softmax of ``x`` along ``axis``, computed without overflow.

    Entries of ``-inf`` get probability 0. A slice that is entirely ``-inf``
    has nothing to normalize and comes back as all zeros.
    """
    x = np.asarray(x, dtype=float)
    peak = np.max(x, axis=axis, keepdims=True)
    peak = np.where(np.isfinite(peak), peak, 0.0)
    exp = np.exp(x - peak)
    total = exp.sum(axis=axis, keepdims=True)
    return np.divide(exp, total, out=np.zeros_like(exp), where=total > 0)


def causal_mask(size: int) -> np.ndarray:
    """Return a boolean ``(size, size)`` mask in which ``mask[i, j]`` is ``j <= i``."""
    return np.tril(np.ones((size, size), dtype=bool))


def attention(
    q: np.ndarray, k: np.ndarray, v: np.ndarray, mask: np.ndarray | None = None
) -> tuple[np.ndarray, np.ndarray]:
    """Scaled dot-product attention.

    ``q`` is ``(..., T_q, d_k)``, ``k`` is ``(..., T_k, d_k)`` and ``v`` is
    ``(..., T_k, d_v)``. ``mask`` broadcasts to ``(..., T_q, T_k)``.

    Returns ``(output, weights)`` with shapes ``(..., T_q, d_v)`` and
    ``(..., T_q, T_k)``. Masked positions get a weight of exactly 0, and a query
    that may attend to nothing gets all-zero weights and an all-zero output.
    """
    scores = q @ np.swapaxes(k, -1, -2) / np.sqrt(q.shape[-1])
    if mask is not None:
        scores = np.where(mask, scores, -np.inf)
    weights = softmax(scores, axis=-1)
    return weights @ v, weights


def multi_head_attention(
    x: np.ndarray,
    w_q: np.ndarray,
    w_k: np.ndarray,
    w_v: np.ndarray,
    w_o: np.ndarray,
    num_heads: int,
    mask: np.ndarray | None = None,
) -> np.ndarray:
    """Multi-head self-attention over ``x`` of shape ``(..., T, d_model)``.

    The four weight matrices are ``(d_model, d_model)`` and multiply on the
    right. Head ``h`` uses columns ``h * d_head`` to ``(h + 1) * d_head`` of the
    projected queries, keys and values. ``mask`` is ``(T, T)`` or
    ``(..., T, T)`` and applies to every head. Returns ``(..., T, d_model)``.
    Raises ``ValueError`` if ``d_model`` is not divisible by ``num_heads``.
    """
    d_model = x.shape[-1]
    if d_model % num_heads != 0:
        raise ValueError(f"d_model={d_model} is not divisible by num_heads={num_heads}")

    def split_heads(t: np.ndarray) -> np.ndarray:
        """(..., T, d_model) -> (..., num_heads, T, d_head)"""
        t = t.reshape(*t.shape[:-1], num_heads, d_model // num_heads)
        return np.swapaxes(t, -2, -3)

    if mask is not None:
        mask = np.asarray(mask)[..., np.newaxis, :, :]  # one axis for the heads to broadcast over
    heads, _ = attention(split_heads(x @ w_q), split_heads(x @ w_k), split_heads(x @ w_v), mask)
    merged = np.swapaxes(heads, -2, -3).reshape(x.shape)
    return merged @ w_o
