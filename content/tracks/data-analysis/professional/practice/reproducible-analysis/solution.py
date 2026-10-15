"""Reading Challenge: a leaderboard and a prize draw that come out the same every time."""

import json
import platform
from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow

PRIZE_BOOKS = 10


def prize_draw(pupils, n, seed):
    """The names of N pupils with at least 10 books, drawn with a generator seeded with SEED."""
    rng = np.random.default_rng(seed)
    eligible = pupils[pupils["books"] >= PRIZE_BOOKS]
    return eligible.sample(n=n, random_state=rng)["name"].tolist()


def leaderboard(pupils):
    """Every pupil ranked by books, then minutes, then name, with hours instead of minutes."""
    ranked = pupils.sort_values(["books", "minutes", "name"], ascending=[False, False, True], ignore_index=True)
    return pd.DataFrame({
        "rank": np.arange(1, len(ranked) + 1),
        "name": ranked["name"],
        "class": ranked["class"],
        "books": ranked["books"],
        "hours": ranked["minutes"] / 60,
        "last_read": ranked["last_read"],
    })


def versions():
    """The versions of Python and the libraries the results were computed with."""
    return {
        "python": platform.python_version(),
        "numpy": np.__version__,
        "pandas": pd.__version__,
        "pyarrow": pyarrow.__version__,
    }


def write_results(pupils, folder):
    """Write leaderboard.csv and versions.json into FOLDER, the same bytes on every run."""
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    leaderboard(pupils).to_csv(
        folder / "leaderboard.csv",
        index=False,
        float_format="%.2f",
        date_format="%Y-%m-%d",
        lineterminator="\n",
    )
    (folder / "versions.json").write_text(json.dumps(versions()) + "\n", encoding="utf-8")
