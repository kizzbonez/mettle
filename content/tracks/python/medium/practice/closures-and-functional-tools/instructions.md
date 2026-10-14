Write the three functions of `solution.py`. Use no global variables and no classes: the first
two functions return functions that remember what they need.

1. `make_stand(stock)` returns a function `sell(wanted=1)`. Each call sells up to `wanted`
   slices from what is left at that stand, and returns how many it actually sold: all of them
   when enough are left, otherwise what was left, and `0` once the stand is empty. Every stand
   made by `make_stand` keeps its own stock.
2. `make_offers(percents)` returns a list of functions, one for each percentage in `percents`,
   in the same order. Each one takes a price and returns
   `round(price * (1 - percent / 100), 2)` for **its own** percentage.
3. `best_sellers(sales, n)` receives a list of dicts such as `{"item": "brownie", "sold": 14}`
   and returns a list of the names of the `n` items sold most, the highest first. Items with
   the same number sold are in alphabetical order. When there are fewer than `n` items, it
   returns them all. The list `sales` is not changed.

Example:

```python
sell = make_stand(5)
sell(2), sell(4), sell()      # (2, 3, 0)
half, tenth = make_offers([50, 10])
half(3.0), tenth(2.5)         # (1.5, 2.25)
sales = [
    {"item": "brownie", "sold": 14},
    {"item": "flapjack", "sold": 9},
    {"item": "apple cake", "sold": 14},
]
best_sellers(sales, 2)        # ['apple cake', 'brownie']
```

**Tips.** Assigning to a variable of the enclosing function needs `nonlocal`. Functions made in
a loop or a comprehension all see the loop variable's last value unless you bind it, for
example with a default argument. A `key` function that returns a tuple sorts by several things;
negate a number to sort it from high to low.
