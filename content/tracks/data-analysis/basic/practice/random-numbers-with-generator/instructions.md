Write the three functions of `solution.py`. Each one receives `rng`, a Generator made by the
caller with `np.random.default_rng(seed)`, and makes **exactly one call** to the method named
below. Do not create a generator of your own, and do not use `np.random.seed` or the other
global `np.random` functions: the tests replay your draws from the same seed and check them
value by value.

1. `roll_dice(rng, rolls, dice)` returns an integer array of shape `(rolls, dice)`: `rolls`
   throws of `dice` six-sided dice, every value from 1 to 6. One call to `rng.integers`.
2. `seating(guests, rng)` returns the guests, a one-dimensional array of names, in a random
   order, as a new array. `guests` itself must not change. One call to `rng.permutation`.
3. `deal_hand(deck, size, rng)` returns `size` **different** cards drawn at random from the
   one-dimensional array `deck`, in the order they were drawn. One call to `rng.choice`. When
   `size` is larger than the deck, `choice` raises `ValueError`: let it propagate. `deck`
   must not change.

Example, each with a new generator seeded with 7:

```python
roll_dice(np.random.default_rng(7), 3, 2)
# array([[6, 4],
#        [5, 6],
#        [4, 5]])
guests = np.array(["Ada", "Bea", "Cal", "Dot", "Eve"])
seating(guests, np.random.default_rng(7))
# array(['Cal', 'Ada', 'Eve', 'Bea', 'Dot'], dtype='<U3')
deck = np.array(["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"])
deal_hand(deck, 5, np.random.default_rng(7))
# array(['7', '8', '9', 'K', 'J'], dtype='<U2')
```

**Tips.** `integers` leaves out `high` unless you pass `endpoint=True`, and `size` takes a
shape tuple. `shuffle` reorders the array you give it and returns `None`; `permutation`
returns a shuffled copy. `choice` draws with replacement unless told otherwise.
