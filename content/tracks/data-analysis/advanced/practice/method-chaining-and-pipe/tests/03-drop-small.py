import numpy as np
import pandas as pd

boxes = pd.DataFrame(
    {"item_type": ["tea", "soup", "jam", "tea", "rice"], "kg": [2.0, np.nan, 0.25, 1.999, 2.5]},
    index=[50, 40, 30, 20, 10],
)
before = boxes.copy()

kept = boxes.pipe(drop_small, 2.0)
assert isinstance(kept, pd.DataFrame), "drop_small returns a DataFrame"
check_frame(kept, boxes.loc[[50, 10]], "drop_small keeps kg of at least min_kg, in order, with their labels, and drops a missing kg")
check_frame(drop_small(boxes, 0.25), boxes.loc[[50, 30, 20, 10]], "drop_small with min_kg equal to the smallest weight")
check_frame(boxes, before, "drop_small does not change the frame it is given")

none = drop_small(boxes, 3.0)
assert isinstance(none, pd.DataFrame) and len(none) == 0, "when nothing is heavy enough the result has no rows"
assert none.columns.tolist() == ["item_type", "kg"], "an empty result still has the frame's columns"
