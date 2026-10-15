---
title: Random Numbers with Generator
summary: Draw reproducible random numbers with `np.random.default_rng(seed)`, generate integers, floats and normally distributed values, sample with and without replacement and with probabilities, shuffle data, and see why the old `np.random.seed` style is discouraged.
minutes: 30
objectives:
  - Create a seeded Generator with `np.random.default_rng` and explain how a seed makes results reproducible
  - Draw integers with `integers` (with and without `endpoint`), floats with `random`, and normal values with `normal`
  - Sample from an array with `choice`, with or without replacement and with given probabilities
  - Tell `shuffle` (in place) from `permutation` (a copy)
  - Explain why `np.random.seed` and the global `np.random` functions are discouraged
---

## Outline

1. Pseudo-random numbers and seeds
2. Integers and floats
3. The normal distribution
4. Sampling with `choice`
5. `shuffle` and `permutation`
6. Why not `np.random.seed`

## Pseudo-random numbers and seeds

Simulations, test data, random samples of a large file, a random split into training and test sets: analysis needs random numbers. A computer makes **pseudo-random** numbers: a deterministic algorithm produces a sequence that looks random, starting from an initial state. The **seed** is a number that sets that state, so the same seed always produces the same sequence.

In NumPy you create a **Generator** with `np.random.default_rng(seed)` and call its methods. By convention the variable is called `rng` (random number generator):

```python
import numpy as np

rng = np.random.default_rng(2026)
print(rng.integers(1, 7, size=10))
print(rng.integers(1, 7, size=10))

again = np.random.default_rng(2026)
print(again.integers(1, 7, size=10))

unseeded_1 = np.random.default_rng().integers(1, 7, size=10)
unseeded_2 = np.random.default_rng().integers(1, 7, size=10)
print(np.array_equal(unseeded_1, unseeded_2))
```

```text
[6 2 1 4 3 3 1 3 4 3]
[5 5 5 6 5 2 6 4 1 2]
[6 2 1 4 3 3 1 3 4 3]
False
```

Ten dice rolls. The second call continues the sequence, so it differs from the first. A new generator with the same seed, `again`, starts the sequence over and repeats the first ten rolls exactly: that is **reproducibility**, and it is why analysis code should seed its generator. Without a seed, NumPy takes fresh entropy from the operating system and every run differs. Run this yourself and you will see the same three lines, because the seed fixes them.

The NumPy guide recommends large seeds, so that yours is unlikely to match anyone else's; any non-negative integer works.

## Integers and floats

`rng.integers(low, high, size)` draws whole numbers from `low` up to, but not including, `high`, like `range`. `endpoint=True` includes `high`. `rng.random(size)` draws floats from 0.0 up to, but not including, 1.0. `size` is a number or a shape tuple, as in lesson 2:

```python
import numpy as np

rng = np.random.default_rng(7)
print(rng.integers(0, 100, size=5))
print(rng.integers(1, 6, size=8, endpoint=True))
print(rng.random(3))
print(rng.random((2, 3)).round(3))
wait_minutes = 2 + (10 - 2) * rng.random(4)
print(wait_minutes.round(1))
```

```text
[94 62 68 89 57]
[5 6 2 1 2 2 6 6]
[0.82122842 0.79706943 0.46793495]
[[0.303 0.278 0.255]
 [0.445 0.505 0.553]]
[10.   8.3  7.   9.9]
```

With `endpoint=True`, 1 to 6 is a die. Every value of `random` is equally likely, a **uniform** distribution. To get uniform floats between two other numbers, stretch and shift: `low + (high - low) * rng.random(size)` gives waits between 2 and 10 minutes. The first one printed as `10.` only because of rounding.

## The normal distribution

Many measurements, such as heights, cluster around an average, with values further away increasingly rare: the bell-shaped **normal distribution**. `rng.normal(loc, scale, size)` draws from one with mean `loc` and standard deviation `scale`:

```python
import numpy as np

rng = np.random.default_rng(42)
heights = rng.normal(loc=170, scale=8, size=10_000)
print(heights[:4].round(1))
print(heights.mean().round(2), heights.std().round(2))
print(np.mean(np.abs(heights - 170) < 8).round(3))
```

```text
[172.4 161.7 176.  177.5]
169.92 8.05
0.678
```

Ten thousand simulated heights have a mean close to 170 and a standard deviation close to 8, but not exactly: it is a sample. The last line uses a mask's mean (lesson 6) to measure the share within one standard deviation of the mean, about 68%, as the normal distribution predicts.

## Sampling with `choice`

`rng.choice(a, size)` picks elements of `a` at random. By default it samples **with replacement**: an element can be picked again, like rolling a die. `replace=False` samples **without replacement**, like drawing names from a hat. `p=` gives each element a probability; the probabilities must add up to 1:

```python
import numpy as np

rng = np.random.default_rng(11)
staff = np.array(["Ama", "Bo", "Cy", "Di", "Ed", "Fay"])
print(rng.choice(staff, size=3, replace=False))
print(rng.choice(staff, size=8))
weather = rng.choice(["sun", "cloud", "rain"], size=1000, p=[0.5, 0.3, 0.2])
kinds, counts = np.unique(weather, return_counts=True)
print(kinds, counts)
rng.choice(staff, size=7, replace=False)
```

```text
['Ama' 'Fay' 'Ed']
['Di' 'Ed' 'Ama' 'Cy' 'Ama' 'Cy' 'Fay' 'Di']
['cloud' 'rain' 'sun'] [299 183 518]
Traceback (most recent call last):
  File "/tmp/work/ex.py", line 10, in <module>
    rng.choice(staff, size=7, replace=False)
    ~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "numpy/random/_generator.pyx", line 925, in numpy.random._generator.Generator.choice
ValueError: Cannot take a larger sample than population when replace is False
```

- Three staff for a spot check, three different people.
- Eight picks with replacement: Ama, Cy and Di came up twice.
- A thousand simulated days with the given chances; the counts are near 500, 300 and 200.
- Seven different people cannot be drawn from six.

`rng.choice(10, size=3)` treats the integer 10 as `np.arange(10)`.

## `shuffle` and `permutation`

Both put elements in a random order. `rng.shuffle(arr)` changes `arr` **in place** and returns `None`. `rng.permutation(arr)` returns a shuffled **copy** and leaves `arr` alone:

```python
import numpy as np

rng = np.random.default_rng(5)
order = np.arange(1, 7)
print(rng.permutation(order), order)
print(rng.shuffle(order), order)
seating = np.array([[1, 2], [3, 4], [5, 6]])
rng.shuffle(seating)
print(seating)
```

```text
[2 5 3 4 6 1] [1 2 3 4 5 6]
None [5 1 2 4 3 6]
[[3 4]
 [1 2]
 [5 6]]
```

On a table both shuffle the rows as whole units: each row keeps its values together, which is what you want when a row is one record. `rng.permutation(n)` with an integer gives a shuffled `np.arange(n)`, handy for putting several arrays in the same random order with fancy indexing.

## Why not `np.random.seed`

Much code online uses an older style: `np.random.seed(3)` followed by functions such as `np.random.randint` or `np.random.rand`. These functions share one hidden, global generator, so any code that draws from it, including a library you call, moves your sequence along:

```python
import numpy as np

np.random.seed(3)
print(np.random.randint(1, 7, size=5))


def helper_from_some_library():
    return np.random.random()


np.random.seed(3)
helper_from_some_library()
print(np.random.randint(1, 7, size=5))
```

```text
[3 1 2 4 1]
[2 4 1 1 1]
```

Same seed, different results, because the helper consumed a number in between. A Generator belongs to your code: pass `rng` to the functions that need randomness, and nothing else can disturb it. The reference describes `np.random.seed` as "a convenience, legacy function" and says that "best practice is to use a dedicated Generator instance". The old functions still work and are not scheduled for removal, but the guide recommends moving to Generator, whose algorithms are faster and more flexible. Note that the two styles give different numbers for the same seed.

## Common mistakes

- **Creating a new seeded generator for every draw.** `np.random.default_rng(1).integers(10)` inside a loop returns the same number every time. Create `rng` once and reuse it.
- **Forgetting that `high` is excluded.** `rng.integers(1, 6)` never gives 6. Use `rng.integers(1, 7)` or `endpoint=True`.
- **Probabilities that do not add up.** `p=[0.5, 0.3, 0.3]` raises `ValueError: Probabilities do not sum to 1`.
- **Using the result of `shuffle`.** It is `None`; use `permutation` for a copy.
- **No seed in an analysis.** Without one, nobody, including you tomorrow, can reproduce the result.

## Practice

1. With seed 123, simulate 1000 rolls of two dice as a `(1000, 2)` array and estimate the chance that they total 7.
2. Draw a random order of the numbers 0 to 9.
3. Draw five values from a normal distribution with mean 50 and standard deviation 5.
4. Show that a new generator with seed 123 repeats the dice exactly.

### Answers

```python
import numpy as np

rng = np.random.default_rng(123)
rolls = rng.integers(1, 6, size=(1000, 2), endpoint=True)
totals = rolls.sum(axis=1)
print(rolls.shape, np.mean(totals == 7).round(3))
deck_order = rng.permutation(10)
print(deck_order)
draws = rng.normal(loc=50, scale=5, size=5)
print(draws.round(2))
check = np.random.default_rng(123).integers(1, 6, size=(1000, 2), endpoint=True)
print(np.array_equal(rolls, check))
```

```text
(1000, 2) 0.168
[7 6 3 0 2 9 1 4 5 8]
[42.33 43.77 50.45 51.85 44.68]
True
```

The exact chance of a 7 is 6 in 36, about 0.167; the simulation gives 0.168. The check passes because the first thing drawn from both generators is the same `(1000, 2)` array.

## Key takeaways

- Create one generator with `rng = np.random.default_rng(seed)` and draw everything from it.
- The same seed and the same calls give the same numbers: seed every analysis.
- `integers` excludes `high` unless `endpoint=True`; `random` gives floats in [0, 1); `normal` takes a mean and a standard deviation.
- `choice` samples with replacement by default; `replace=False` and `p=` change that.
- `shuffle` works in place and returns `None`; `permutation` returns a copy.
- `np.random.seed` and the global functions are legacy: their hidden shared state makes results fragile.

## Further reading

- [Random sampling (numpy.random): quick start](https://numpy.org/doc/stable/reference/random/index.html)
- [Random Generator](https://numpy.org/doc/stable/reference/random/generator.html)
- [numpy.random.Generator.choice](https://numpy.org/doc/stable/reference/random/generated/numpy.random.Generator.choice.html)
- [numpy.random.seed (legacy)](https://numpy.org/doc/stable/reference/random/generated/numpy.random.seed.html)
