"""A reference implementation of attention, written for clarity rather than speed.

Shapes use ``...`` for any number of leading batch dimensions, ``T`` for the
sequence length and ``d`` for a vector size. A mask is a boolean array in which
``True`` means "this query may attend to this key".
"""

import numpy as np


def softmax(x: np.ndarray, axis: int = -1) -> np.ndarray:
    """Return the softmax of ``x`` along ``axis``, computed without overflow.

    The result has the shape of ``x``; entries along ``axis`` are non-negative
    and sum to 1. Entries of ``-inf`` get probability 0.
    """
    raise NotImplementedError("softmax is not implemented yet")


def causal_mask(size: int) -> np.ndarray:
    """Return a boolean ``(size, size)`` mask in which ``mask[i, j]`` is ``j <= i``."""
    raise NotImplementedError("causal_mask is not implemented yet")


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
    # TODO 1: scores = q @ (k with its last two axes swapped) / sqrt(d_k)
    # TODO 2: where the mask is False, the score must not contribute at all
    # TODO 3: weights = softmax over the last axis; output = weights @ v
    raise NotImplementedError("attention is not implemented yet")


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
    # TODO 4: project x into q, k and v
    # TODO 5: split each into num_heads slices of size d_head and run attention per head
    # TODO 6: concatenate the head outputs in order and multiply by w_o
    raise NotImplementedError("multi_head_attention is not implemented yet")
