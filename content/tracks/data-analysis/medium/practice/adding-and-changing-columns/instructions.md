Write the four functions of `solution.py`. `orders` is a DataFrame with the columns `order`,
`product`, `copies`, `unit_price`, `src` (a channel code), `rush` (`bool`) and `note`. **Every
function returns a new frame and leaves `orders` exactly as it was**: no new column, no changed
value.

1. `add_totals(orders)` returns `orders` with three new columns at the end, in this order:
   `subtotal` (`copies` times `unit_price`), `rush_fee` (`15.0` for a rush order, `0.0` otherwise)
   and `total` (`subtotal` plus `rush_fee`, rounded to 2 decimals).
2. `tidy(orders)` returns `orders` with the column `src` renamed to `channel`, in the same place,
   its codes spelt out: `"S"` is `"shop"`, `"W"` is `"web"`, `"E"` is `"email"`, and any other
   code becomes missing (NaN). The column `note` is dropped.
3. `bulk_price(orders, min_copies, discount)` returns `orders` with the same columns, where the
   `unit_price` of every order of **at least** `min_copies` copies is multiplied by
   `1 - discount` and rounded to 2 decimals. The other prices stay exactly as they were.
4. `correct_products(orders, corrections)` returns `orders` with every `product` that is a key of
   the dict `corrections` replaced by its value. Every other product stays as it was.

Example:

```python
orders = pd.DataFrame(
    {
        "order": ["P101", "P102", "P103", "P104", "P105"],
        "product": ["flyer-a5", "poster-a2", "card", "flyer-a5", "postr-a2"],
        "copies": [500, 20, 250, 1000, 5],
        "unit_price": [0.12, 4.50, 0.30, 0.10, 4.50],
        "src": ["W", "S", "E", "W", "X"],
        "rush": [False, True, False, True, False],
        "note": ["", "matt", None, "two boxes", ""],
    }
)
print(add_totals(orders)[["order", "subtotal", "rush_fee", "total"]])
print(tidy(orders))
bulk_price(orders, 250, 0.1)["unit_price"].tolist()     # [0.11, 4.5, 0.27, 0.09, 4.5]
correct_products(orders, {"postr-a2": "poster-a2"})["product"].tolist()
# ['flyer-a5', 'poster-a2', 'card', 'flyer-a5', 'poster-a2']
```

```text
  order  subtotal  rush_fee  total
0  P101      60.0       0.0   60.0
1  P102      90.0      15.0  105.0
2  P103      75.0       0.0   75.0
3  P104     100.0      15.0  115.0
4  P105      22.5       0.0   22.5
  order    product  copies  unit_price channel   rush
0  P101   flyer-a5     500        0.12     web  False
1  P102  poster-a2      20        4.50    shop   True
2  P103       card     250        0.30   email  False
3  P104   flyer-a5    1000        0.10     web   True
4  P105   postr-a2       5        4.50     NaN  False
```

**Tips.** `assign` returns a new frame, and with `pd.col` a later column can use an earlier one.
`map` and `replace` both take a dict but treat values missing from it differently. `mask` or
`where` choose between the old and the new price; if you prefer `loc[mask, "col"] = ...`, use it
on a copy (`orders.copy()`), never on `orders` itself.
