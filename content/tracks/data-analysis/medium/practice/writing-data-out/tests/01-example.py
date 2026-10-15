import json
from pathlib import Path

import pandas as pd

size = pd.CategoricalDtype(["small", "medium", "large"], ordered=True)
deliveries = pd.DataFrame(
    {
        "customer": ["Moreau", "Haddad", "Kim", "Lefèvre"],
        "delivered": pd.to_datetime(["2026-06-02", "2026-06-02", "2026-06-03", "2026-06-04"]),
        "size": pd.Categorical(["large", "small", "medium", "small"], dtype=size),
        "weight_kg": [8.25, 3.1, 5.0, 2.95],
        "bags_returned": pd.array([2, None, 1, 0], dtype="Int64"),
    },
    index=pd.Index(["B01", "B02", "B03", "B04"], name="box_id"),
)
before = deliveries.copy()

save(deliveries, "boxes.csv")
assert Path("boxes.csv").read_text(encoding="utf-8").splitlines() == [
    "box_id,customer,delivered,size,weight_kg,bags_returned",
    "B01,Moreau,2026-06-02,large,8.25,2",
    "B02,Haddad,2026-06-02,small,3.1,",
    "B03,Kim,2026-06-03,medium,5.0,1",
    "B04,Lefèvre,2026-06-04,small,2.95,0",
], "save writes boxes.csv as in the example"
check_frame(load("boxes.csv"), deliveries, "load('boxes.csv') gives back the frame that was saved")

write_spreadsheet(deliveries, "farm.csv")
assert Path("farm.csv").read_bytes().decode("utf-8").splitlines() == [
    "﻿box_id;customer;delivered;size;weight_kg;bags_returned",
    "B01;Moreau;02/06/2026;large;8,25;2",
    "B02;Haddad;02/06/2026;small;3,10;",
    "B03;Kim;03/06/2026;medium;5,00;1",
    "B04;Lefèvre;04/06/2026;small;2,95;0",
], "write_spreadsheet writes farm.csv as in the example, starting with the byte-order mark"

write_feed(deliveries, "feed.jsonl")
lines = Path("feed.jsonl").read_text(encoding="utf-8").splitlines()
assert len(lines) == 4, "write_feed writes one line per box"
assert json.loads(lines[0]) == {
    "box_id": "B01",
    "customer": "Moreau",
    "delivered": "2026-06-02T00:00:00.000",
    "size": "large",
    "weight_kg": 8.25,
    "bags_returned": 2,
}, "the first line of feed.jsonl, as in the example"
check_frame(deliveries, before, "the functions leave deliveries as it was")
