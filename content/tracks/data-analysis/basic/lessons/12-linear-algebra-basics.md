---
title: Linear Algebra Basics
summary: Multiply matrices with `@` and tell it from element-wise `*`, take dot products, solve a system of equations with `np.linalg.solve` rather than an inverse, measure lengths and distances with `norm`, fit a best-fit line with `lstsq`, and compare floating-point results with `np.allclose`.
minutes: 35
objectives:
  - Compute matrix products with `@` or `np.matmul`, predict their shape, and tell them from element-wise `*`
  - Compute dot products of vectors with `@` or `np.dot`
  - Solve a system of linear equations with `np.linalg.solve`, and explain why it is preferred to `inv`, and what the determinant says
  - Compute lengths and distances with `np.linalg.norm`
  - Fit a straight line with `np.linalg.lstsq`, and compare float results with `np.allclose`
---

## Outline

1. Matrix multiplication: `@` against `*`
2. Dot products
3. Solving a system of equations
4. Lengths and distances: `norm`
5. A best-fit line with `lstsq`
6. Comparing floats: `np.allclose`

## Matrix multiplication: `@` against `*`

Lesson 7 showed that `*` multiplies element by element. **Matrix multiplication** is a different operation. For a table `A` of shape `(n, k)` and a table `B` of shape `(k, m)`, each element of the result is a row of `A` times a column of `B`, multiplied pair by pair and added up. The result has shape `(n, m)`, and the inner lengths, both `k`, must match. Python writes it `@`, and NumPy implements it as `np.matmul`.

A bakery knows how many loaves of each kind it must bake each day, and how much flour and water each kind needs:

```python
import numpy as np

# Orders: one row per day, one column per loaf (white, rye, seeded)
orders = np.array([
    [40, 12, 20],
    [35, 18, 25],
])
# Flour and water in kg per loaf: one row per loaf, one column per ingredient
recipe = np.array([
    [0.50, 0.33],
    [0.45, 0.35],
    [0.40, 0.30],
])
needs = orders @ recipe
print(orders.shape, recipe.shape, needs.shape)
print(needs)
print(np.matmul(orders, recipe)[0])
orders * recipe
```

```text
(2, 3) (3, 2) (2, 2)
[[33.4  23.4 ]
 [35.6  25.35]]
[33.4 23.4]
Traceback (most recent call last):
  File "/tmp/work/ex.py", line 18, in <module>
    orders * recipe
    ~~~~~~~^~~~~~~~
ValueError: operands could not be broadcast together with shapes (2,3) (3,2) 
```

Day 0 needs 40 × 0.50 + 12 × 0.45 + 20 × 0.40 = 33.4 kg of flour: the day's orders times the flour column. `(2, 3) @ (3, 2)` gives `(2, 2)`: days by ingredients. `orders * recipe` is not matrix multiplication at all; it tries to broadcast and fails. The order matters too: `recipe @ orders` is a `(3, 3)` table of something else.

## Dot products

For two one-dimensional arrays of the same length, `@` gives the **dot product**: the sum of the element-wise products, a single number. `np.dot` gives the same:

```python
import numpy as np

price = np.array([2.80, 3.40, 3.10])
loaves = np.array([40, 12, 20])
print(price * loaves)
print(np.dot(price, loaves), price @ loaves, (price * loaves).sum())
orders = np.array([[40, 12, 20], [35, 18, 25]])
print(orders @ price)
```

```text
[112.   40.8  62. ]
214.8 214.8 214.8
[214.8 236.7]
```

`price @ loaves` is the day's takings. A table times a vector, `orders @ price`, gives one dot product per row: the takings for each day. The NumPy reference prefers `@` for matrix products.

## Solving a system of equations

A theatre sold 2 adult and 3 child tickets for 31, and 1 adult and 4 child tickets for 28. What does each ticket cost? Written as equations, `2a + 3c = 31` and `1a + 4c = 28`. In matrix form that is `A @ x = b`, where `A` holds the coefficients, `x` the unknowns and `b` the totals. `np.linalg.solve(A, b)` finds `x`:

```python
import numpy as np

# 2 adult + 3 child tickets cost 31; 1 adult + 4 child tickets cost 28
coefficients = np.array([[2.0, 3.0], [1.0, 4.0]])
totals = np.array([31.0, 28.0])
adult, child = np.linalg.solve(coefficients, totals)
print(adult, child)
print(coefficients @ np.array([adult, child]))
print(np.linalg.inv(coefficients) @ totals)
print(np.linalg.det(coefficients))
same_info = np.array([[2.0, 3.0], [4.0, 6.0]])
print(np.linalg.det(same_info))
try:
    np.linalg.solve(same_info, np.array([31.0, 62.0]))
except np.linalg.LinAlgError as error:
    print("LinAlgError:", error)
```

```text
8.0 5.0
[31. 28.]
[8. 5.]
5.000000000000001
0.0
LinAlgError: Singular matrix
```

- An adult ticket costs 8 and a child ticket 5; multiplying back gives the totals.
- `np.linalg.inv(A)` computes the **inverse** matrix, and `inv(A) @ b` also gives the answer. Prefer `solve`: it does less work and is usually more accurate, because it never builds the inverse.
- The **determinant**, `np.linalg.det`, is a single number computed from a square matrix. When it is 0, the matrix is **singular**: the equations do not pin down one answer. The second system says the same thing twice (the second row is double the first), so `solve` raises `LinAlgError: Singular matrix`.

`solve` needs a square matrix of independent equations, as many as unknowns. With more equations than unknowns, use `lstsq`, below.

## Lengths and distances: `norm`

The **norm** of a vector, by default, is its length: the square root of the sum of its squares, as in Pythagoras. The distance between two points is the norm of their difference:

```python
import numpy as np

depot = np.array([2.0, 1.0])
drops = np.array([[5.0, 5.0], [2.0, 4.0], [-1.0, 5.0]])
print(np.linalg.norm(np.array([3.0, 4.0])))
print(np.linalg.norm(drops - depot, axis=1))
print(np.sqrt(((drops - depot) ** 2).sum(axis=1)))
```

```text
5.0
[5. 3. 5.]
[5. 3. 5.]
```

`drops - depot` broadcasts the depot's position against every drop-off (lesson 8), and `axis=1` takes one norm per row: the straight-line distance in kilometres to each drop. The last line computes the same by hand.

## A best-fit line with `lstsq`

A kiosk recorded the afternoon temperature and ice creams sold on seven days. No straight line `sold = slope × temp + intercept` passes through every point, so we want the one with the smallest total squared error: the **least-squares** fit. Each day gives one equation in the two unknowns, slope and intercept. Stack them as a **design matrix** with the temperatures in one column and ones in the other (the ones multiply the intercept), and call `np.linalg.lstsq`:

```python
import numpy as np

# Afternoon temperature (C) and ice creams sold at a kiosk
temp = np.array([14.0, 17.0, 19.0, 22.0, 24.0, 27.0, 30.0])
sold = np.array([52.0, 71.0, 80.0, 102.0, 108.0, 131.0, 148.0])
design = np.stack([temp, np.ones_like(temp)], axis=1)
print(design[:3])
coefficients, residuals, rank, singular = np.linalg.lstsq(design, sold)
slope, intercept = coefficients
print(round(slope, 3), round(intercept, 3))
print((slope * np.array([20.0, 32.0]) + intercept).round(1))
print(residuals.round(2), rank)
```

```text
[[14.  1.]
 [17.  1.]
 [19.  1.]]
5.988 -32.024
[ 87.7 159.6]
[25.4] 2
```

`lstsq` returns four things; the first holds the coefficients. Each extra degree sells about six more ice creams, and the line predicts about 88 at 20 °C. `residuals` is the sum of the squared errors the line could not explain. The prediction at 32 °C is outside the data, so trust it less.

## Comparing floats: `np.allclose`

Floats are stored in binary and most decimals cannot be represented exactly, so results carry tiny errors. Never compare float results with `==`:

```python
import numpy as np

print(0.1 + 0.2 == 0.3, 0.1 + 0.2)
print(np.isclose(0.1 + 0.2, 0.3))
coefficients = np.array([[2.0, 3.0], [1.0, 4.0]])
product = coefficients @ np.linalg.inv(coefficients)
print(product)
print(np.array_equal(product, np.eye(2)), np.allclose(product, np.eye(2)))
print(np.allclose([1.0, 2.0], [1.0, 2.001]), np.allclose([1.0, 2.0], [1.0, 2.001], atol=0.01))
```

```text
False 0.30000000000000004
True
[[ 1.00000000e+00 -1.11022302e-16]
 [ 0.00000000e+00  1.00000000e+00]]
False True
False True
```

A matrix times its inverse should be the identity matrix of lesson 2, but one element came out as -1.1e-16. `np.isclose` compares element by element within a tolerance; `np.allclose` returns `True` when every element is close. Their defaults allow a relative difference of 1e-05 and an absolute one of 1e-08; widen them with `rtol=` and `atol=` when your data is rougher.

## Common mistakes

- **`*` when you meant `@`.** `*` is element-wise and either fails or gives a different answer. `m * m` and `m @ m` are not the same.
- **Mismatched inner lengths.** `(2, 2) @ (1, 3)` raises `ValueError: matmul: Input operand 1 has a mismatch in its core dimension 0`. The last length of the left must equal the first length of the right.
- **Solving with `inv`.** `inv(A) @ b` is slower and less accurate than `solve(A, b)`.
- **Expecting an exact `det`.** It is a float: `[[2, 3], [1, 4]]` gave `5.000000000000001`.
- **`==` on float results.** Use `np.allclose` or `np.isclose`.

## Practice

1. Two staff worked `[[8, 6, 0], [4, 7, 9]]` hours on three shifts paid 15.0, 18.5 and 21.0 an hour. Compute each person's pay with one `@`.
2. Solve `x + y + z = 12`, `2x + y = 10`, `y + 3z = 17`, and check the answer with `np.allclose`.
3. Fit a line through `x = [1, 2, 3, 4, 5]`, `y = [2.1, 3.9, 6.2, 7.8, 10.1]`.

### Answers

```python
import numpy as np

hours = np.array([[8, 6, 0], [4, 7, 9]])
rate = np.array([15.0, 18.5, 21.0])
print(hours @ rate)
system = np.array([[1.0, 1.0, 1.0], [2.0, 1.0, 0.0], [0.0, 1.0, 3.0]])
right = np.array([12.0, 10.0, 17.0])
solution = np.linalg.solve(system, right)
print(solution, np.allclose(system @ solution, right))
x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([2.1, 3.9, 6.2, 7.8, 10.1])
(slope, intercept), *_ = np.linalg.lstsq(np.stack([x, np.ones_like(x)], axis=1), y)
print(round(slope, 2), round(intercept, 2))
```

```text
[231.  378.5]
[1. 8. 3.] True
1.99 0.05
```

1. A `(2, 3)` table of hours times three rates gives two amounts of pay.
2. `x = 1`, `y = 8`, `z = 3`. A missing term, such as `z` in the second equation, is a 0 in the matrix.
3. `(slope, intercept), *_ = ...` unpacks the coefficients and ignores the other three results.

## Key takeaways

- `@` (`np.matmul`) is matrix multiplication: `(n, k) @ (k, m)` gives `(n, m)`; `*` is element-wise.
- For two vectors, `@` and `np.dot` give the dot product.
- `np.linalg.solve(A, b)` solves `A @ x = b`; prefer it to `inv`. A determinant of 0 means a singular matrix.
- `np.linalg.norm` gives lengths and, of a difference, distances.
- `np.linalg.lstsq` with a column of ones fits a best-fit line.
- Compare float results with `np.allclose`, never `==`.

## Further reading

- [Linear algebra (numpy.linalg)](https://numpy.org/doc/stable/reference/routines.linalg.html)
- [numpy.linalg.solve](https://numpy.org/doc/stable/reference/generated/numpy.linalg.solve.html)
- [numpy.linalg.lstsq](https://numpy.org/doc/stable/reference/generated/numpy.linalg.lstsq.html)
- [numpy.allclose](https://numpy.org/doc/stable/reference/generated/numpy.allclose.html)
