import json
from pathlib import Path

import numpy as np
import pandas as pd

size = pd.CategoricalDtype(["small", "medium", "large"], ordered=True)
boxes = pd.DataFrame(
    {
        "customer": ["Zhou", "Yates", "Xu"],
        "delivered": pd.to_datetime(["2026-09-14", "2026-09-15", "2026-09-15"]),
        "size": pd.Categorical(["small", "large", "small"], dtype=size),
        "weight_kg": [2.75, np.nan, 3.0],
        "bags_returned": pd.array([None, 4, None], dtype="Int64"),
    },
    index=pd.Index(["Q3", "Q1", "Q2"], name="box_id"),
)
before = boxes.copy()
write_feed(boxes, "t4-feed.jsonl")
check_frame(boxes, before, "write_feed leaves deliveries unchanged")

text = Path("t4-feed.jsonl").read_text(encoding="utf-8")
assert not text.lstrip().startswith("["), "the feed is JSON Lines, one object per line, not one JSON array"
records = [json.loads(line) for line in text.splitlines() if line.strip()]
assert [record["box_id"] for record in records] == ["Q3", "Q1", "Q2"], "every box is a line with its box_id, in order"
assert list(records[0]) == ["box_id", "customer", "delivered", "size", "weight_kg", "bags_returned"], (
    "each object has the six keys, box_id first"
)
assert [record["delivered"][:19] for record in records] == [
    "2026-09-14T00:00:00", "2026-09-15T00:00:00", "2026-09-15T00:00:00"
], "dates are written as ISO date-time strings"
assert [record["bags_returned"] for record in records] == [None, 4, None], "a missing bags_returned is null"
assert records[1]["weight_kg"] is None and records[0]["weight_kg"] == 2.75, "weights are numbers, null when missing"
assert [record["size"] for record in records] == ["small", "large", "small"], "size is written as its text"
