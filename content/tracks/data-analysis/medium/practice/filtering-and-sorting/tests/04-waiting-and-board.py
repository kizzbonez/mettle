import numpy as np
import pandas as pd

animals = pd.DataFrame(
    {
        "name": ["Fig", "Moss", "Tango", "Bean", "Kip", "Sage", "Dot"],
        "species": ["rabbit", "dog", "cat", "dog", "cat", "rabbit", "dog"],
        "age_years": [1.0, 4.0, 2.0, 8.0, 3.0, 5.0, 0.5],
        "weight_kg": [1.8, 20.0, 3.5, 12.0, None, 2.4, 7.0],
        "days_here": [30, 75, 30, 75, 12, 30, 75],
        "vaccinated": [True, True, False, True, True, True, False],
        "reserved": [False, True, False, False, False, False, False],
    },
    index=["R1", "R2", "R3", "R4", "R5", "R6", "R7"],
)
before = animals.copy()

check_frame(
    longest_waiting(animals, 2),
    animals.loc[["R2", "R4"]],
    "at the cut-off, the animals earlier in the table are kept",
)
check_frame(
    longest_waiting(animals, 5),
    animals.loc[["R2", "R4", "R7", "R1", "R3"]],
    "equally long waits keep their order in the table, labels and all columns kept",
)
assert len(longest_waiting(animals, 0)) == 0, "longest_waiting of 0 animals gives no rows"

check_frame(
    adoption_board(animals),
    pd.DataFrame(
        {
            "name": ["Tango", "Kip", "Moss", "Bean", "Dot", "Fig", "Sage"],
            "species": ["cat", "cat", "dog", "dog", "dog", "rabbit", "rabbit"],
            "days_here": [30, 12, 75, 75, 75, 30, 30],
        }
    ),
    "adoption_board sorts by species, then most days first, keeps ties in order and numbers the rows from 0",
)
check_frame(animals, before, "longest_waiting and adoption_board do not change the frame they are given")

rng = np.random.default_rng(7)
n = 100_000
days = rng.integers(0, 50, size=n)
crowd = pd.DataFrame(
    {
        "name": [f"pet{i}" for i in range(n)],
        "species": rng.choice(["dog", "cat", "rabbit"], size=n),
        "age_years": np.ones(n),
        "weight_kg": np.ones(n),
        "days_here": days,
        "vaccinated": np.ones(n, dtype=bool),
        "reserved": np.zeros(n, dtype=bool),
    }
)
top = longest_waiting(crowd, 500)
check_array(
    top.index.to_numpy(),
    np.argsort(-days, kind="stable")[:500],
    "with many equal waits, longest_waiting still puts the earlier animals first",
)
