from pathlib import Path

import numpy as np
import pandas as pd

size = pd.CategoricalDtype(["small", "medium", "large"], ordered=True)
boxes = pd.DataFrame(
    {
        "customer": ["Smith; J", "Ødegaard", "Ward"],
        "delivered": pd.to_datetime(["2026-12-24", "2026-01-05", None]),
        "size": pd.Categorical(["large", "small", "medium"], dtype=size),
        "weight_kg": [10.0, 0.5, np.nan],
        "bags_returned": pd.array([None, 12, 0], dtype="Int64"),
    },
    index=pd.Index(["X9", "X1", "X5"], name="box_id"),
)
before = boxes.copy()
write_spreadsheet(boxes, "t3-farm.csv")
check_frame(boxes, before, "write_spreadsheet leaves deliveries unchanged")

raw = Path("t3-farm.csv").read_bytes()
assert raw.startswith(b"\xef\xbb\xbf"), "the spreadsheet file starts with the UTF-8 byte-order mark (utf-8-sig)"
assert "Ødegaard".encode("utf-8") in raw, "the text after the mark is UTF-8"
assert raw.decode("utf-8-sig").splitlines() == [
    "box_id;customer;delivered;size;weight_kg;bags_returned",
    'X9;"Smith; J";24/12/2026;large;10,00;',
    "X1;Ødegaard;05/01/2026;small;0,50;12",
    "X5;Ward;;medium;;0",
], "fields are separated by ';', weights have two decimals and a comma, dates are DD/MM/YYYY and gaps are empty"
