import json
from pathlib import Path

import pandas as pd

pupils = pd.read_csv("data/pupils.csv", parse_dates=["last_read"])

assert prize_draw(pupils, 3, seed=2026) == ["Amara", "Hamza", "Chloe"], (
    "prize_draw draws the example's three winners with a generator seeded with 2026"
)

board = leaderboard(pupils)
check_frame(
    board[["rank", "name", "books"]],
    pd.DataFrame({
        "rank": list(range(1, 13)),
        "name": ["Chloe", "Finn", "Isla", "Hamza", "Amara", "Dev", "Lily", "Grace", "Jonah", "Ben", "Kofi", "Ella"],
        "books": [21, 21, 17, 14, 14, 14, 14, 11, 10, 9, 6, 3],
    }),
    "leaderboard ranks the example's pupils by books, then minutes, then name",
)

write_results(pupils, "results")
expected = """rank,name,class,books,hours,last_read
1,Chloe,4B,21,20.83,2026-06-28
2,Finn,4C,21,16.33,2026-06-28
3,Isla,4C,17,13.33,2026-06-27
4,Hamza,4B,14,12.42,2026-06-28
5,Amara,4B,14,10.17,2026-06-27
6,Dev,4A,14,10.17,2026-06-26
7,Lily,4C,14,10.17,2026-06-28
8,Grace,4A,11,11.67,2026-06-25
9,Jonah,4A,10,6.50,2026-06-24
10,Ben,4A,9,7.58,2026-06-28
11,Kofi,4B,6,4.00,2026-06-22
12,Ella,4C,3,1.58,2026-06-20
"""
assert Path("results/leaderboard.csv").read_bytes() == expected.encode("utf-8"), (
    "write_results writes the example's leaderboard.csv exactly as the instructions show"
)
assert set(json.loads(Path("results/versions.json").read_text(encoding="utf-8"))) == {
    "python", "numpy", "pandas", "pyarrow"
}, "versions.json records the versions of python, numpy, pandas and pyarrow"
