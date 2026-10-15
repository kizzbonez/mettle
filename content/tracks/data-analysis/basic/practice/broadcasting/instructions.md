Write the three functions of `solution.py` with broadcasting: no loops, and no table of
repeated copies built by hand. `orders` is a two-dimensional integer array with one
row per café and one column per kind of loaf. `prices` has one price per kind of loaf;
`discounts` has one rate per café (`0.1` is 10% off). No function changes its arguments.
Results are not rounded.

1. `bill_lines(orders, prices, discounts)` returns a float array of the shape of `orders`:
   what each café pays for each kind of loaf, the number ordered times the loaf's price times
   `1 - discount` of that café.
2. `versus_average(orders)` returns a float array of the shape of `orders`: each order minus
   the average order of that kind of loaf over all the cafés.
3. `price_list(prices, quantities)` returns a float array of shape
   `(len(quantities), len(prices))`: row `i` holds the price of `quantities[i]` of each kind
   of loaf.

Example:

```python
orders = np.array([[10, 4, 0], [6, 6, 12]])   # two cafés, three kinds of loaf
prices = np.array([2.40, 3.10, 0.85])
discounts = np.array([0.0, 0.10])
bill_lines(orders, prices, discounts)
# array([[24.  , 12.4 ,  0.  ],
#        [12.96, 16.74,  9.18]])
versus_average(orders)
# array([[ 2., -1., -6.],
#        [-2.,  1.,  6.]])
price_list(prices, np.array([1, 6, 12]))
# array([[ 2.4 ,  3.1 ,  0.85],
#        [14.4 , 18.6 ,  5.1 ],
#        [28.8 , 37.2 , 10.2 ]])
```

**Tips.** Shapes line up from the right, so a one-dimensional array always matches the
columns. Values that belong to the rows need the shape `(n, 1)`: `[:, np.newaxis]` or
`reshape(-1, 1)`. A column combined with a row gives a table of every pair. When a table is
square, a value per row used without `np.newaxis` raises no error, it is just wrong.
