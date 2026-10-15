import pandas as pd

frame = pd.DataFrame(
    {
        " Weight (g) ": [100.0, 250.0],
        "Box Count (units)": [3, 4],
        "ID": ["x1", "x2"],
        "Collected By Van": [True, False],
        "notes": ["", "fragile"],
    },
    index=["r1", "r2"],
)
before = frame.copy()
result = tidy_names(frame)
assert isinstance(result, pd.DataFrame), "tidy_names returns a DataFrame"
assert result.columns.tolist() == ["weight_g", "box_count_units", "id", "collected_by_van", "notes"], (
    "tidy_names strips, lower-cases, removes brackets and joins words with underscores"
)
check_frame(
    result.set_axis(frame.columns, axis=1),
    frame,
    "tidy_names keeps every value, the rows and their index labels",
)
check_frame(frame, before, "tidy_names does not change the frame it is given")
assert tidy_names(frame.iloc[0:0]).columns.tolist() == result.columns.tolist(), "tidy_names works on a frame without rows"
