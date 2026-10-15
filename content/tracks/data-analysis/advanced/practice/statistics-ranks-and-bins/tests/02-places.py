import pandas as pd

entries = pd.DataFrame(
    {
        "grower": ["Wyn", "Una", "Tam", "Sol", "Rhi", "Pip", "Ola", "Nia", "Mo"],
        "vegetable": ["leek", "leek", "carrot", "leek", "leek", "carrot", "leek", "squash", "carrot"],
        "kg": [3.5, 3.5, 1.25, 2.0, 3.5, 1.25, 1.0, 40.0, 0.75],
    },
    index=[90, 80, 70, 60, 50, 40, 30, 20, 10],
)
before = entries.copy()
result = places(entries)
assert isinstance(result, pd.DataFrame), "places returns a DataFrame"
assert result.columns.tolist() == ["grower", "vegetable", "kg", "place"], "places keeps the columns and adds place"
expected = pd.DataFrame(
    {
        "grower": ["Pip", "Tam", "Mo", "Rhi", "Una", "Wyn", "Sol", "Ola", "Nia"],
        "vegetable": ["carrot", "carrot", "carrot", "leek", "leek", "leek", "leek", "leek", "squash"],
        "kg": [1.25, 1.25, 0.75, 3.5, 3.5, 3.5, 2.0, 1.0, 40.0],
        "place": [1, 1, 2, 1, 1, 1, 2, 3, 1],
    }
)
check_frame(
    result,
    expected,
    "places ranks within each vegetable, heaviest first, ties sharing a place with no gap after them, sorted by vegetable, place and grower",
)
check_frame(entries, before, "places does not change the entries")
