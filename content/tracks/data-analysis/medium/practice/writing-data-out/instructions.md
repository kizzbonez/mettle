Write the four functions of `solution.py`. `deliveries` is a DataFrame indexed by the box id
(text, index named `box_id`) with these columns:

| column | dtype |
| --- | --- |
| `customer` | `str` |
| `delivered` | `datetime64[us]` (dates only, no time of day) |
| `size` | ordered `category`: `small` < `medium` < `large` (the starter defines `SIZE`) |
| `weight_kg` | `float64` |
| `bags_returned` | `Int64`, `<NA>` when the driver did not note it |

Each writing function writes the file `path` (in the working folder) and returns nothing. None of
them changes `deliveries`.

1. `save(deliveries, path)` writes a plain CSV file: a header line, then one line per box, with the
   box id first in a column `box_id`, then the other columns in order. Commas between fields,
   dates as `YYYY-MM-DD`, an empty field for a missing value. (This is what `to_csv` writes when
   you leave its options alone.)
2. `load(path)` reads a file in that layout and returns a frame **equal** to the one saved: the
   same index named `box_id`, columns, values and dtypes, including all three `size` categories
   in order even when some size does not appear in the file.
3. `write_spreadsheet(deliveries, path)` writes a CSV for the farm's spreadsheet: the same columns
   as `save`, but with `;` between fields, a decimal comma, every weight with **two** decimals,
   dates as `DD/MM/YYYY`, an empty field for a missing value, and the encoding `utf-8-sig` (UTF-8
   with the byte-order mark that spreadsheets look for).
4. `write_feed(deliveries, path)` writes JSON Lines for the website: one JSON object per box, in
   order, with the keys `box_id`, `customer`, `delivered` (an ISO date-time string), `size`,
   `weight_kg` and `bags_returned` (`null` when missing).

Example:

```python
deliveries = pd.DataFrame(
    {
        "customer": ["Moreau", "Haddad", "Kim", "Lefèvre"],
        "delivered": pd.to_datetime(["2026-06-02", "2026-06-02", "2026-06-03", "2026-06-04"]),
        "size": pd.Categorical(["large", "small", "medium", "small"], dtype=SIZE),
        "weight_kg": [8.25, 3.1, 5.0, 2.95],
        "bags_returned": pd.array([2, None, 1, 0], dtype="Int64"),
    },
    index=pd.Index(["B01", "B02", "B03", "B04"], name="box_id"),
)
save(deliveries, "boxes.csv")
load("boxes.csv").equals(deliveries)       # True
write_spreadsheet(deliveries, "farm.csv")
write_feed(deliveries, "feed.jsonl")
```

`boxes.csv`:

```text
box_id,customer,delivered,size,weight_kg,bags_returned
B01,Moreau,2026-06-02,large,8.25,2
B02,Haddad,2026-06-02,small,3.1,
B03,Kim,2026-06-03,medium,5.0,1
B04,Lefèvre,2026-06-04,small,2.95,0
```

`farm.csv` (after its three byte-order-mark bytes):

```text
box_id;customer;delivered;size;weight_kg;bags_returned
B01;Moreau;02/06/2026;large;8,25;2
B02;Haddad;02/06/2026;small;3,10;
B03;Kim;03/06/2026;medium;5,00;1
B04;Lefèvre;04/06/2026;small;2,95;0
```

The first line of `feed.jsonl`:

```text
{"box_id":"B01","customer":"Moreau","delivered":"2026-06-02T00:00:00.000","size":"large","weight_kg":8.25,"bags_returned":2}
```

**Tips.** A CSV holds only text: `load` needs `index_col`, `parse_dates` and a `dtype` dict, and
`dtype` accepts `SIZE` itself. `to_csv` takes `sep`, `decimal`, `float_format`, `date_format` and
`encoding`. `orient="records"` leaves the index out of JSON, so bring `box_id` back as a column
first, and pass `date_format="iso"`.
