import pandas as pd

animals = pd.DataFrame(
    {
        "name": ["Bramble", "Pip", "Luna", "Biscuit", "Shadow", "Clover", "Ziggy", "Mabel"],
        "species": ["dog", "cat", "cat", "rabbit", "dog", "rabbit", "cat", "dog"],
        "age_years": [3.0, 1.5, 9.0, 0.5, 6.0, 2.0, 4.0, 11.0],
        "weight_kg": [24.5, 4.1, 4.1, None, 31.0, 1.9, None, 18.2],
        "days_here": [40, 12, 95, 7, 40, 21, 63, 120],
        "vaccinated": [True, True, True, False, True, True, True, True],
        "reserved": [False, False, False, False, True, False, False, False],
    }
)

check_frame(
    available(animals, ["dog", "cat"], 1, 9),
    animals.loc[[0, 1, 2, 6]],
    "available(animals, ['dog', 'cat'], 1, 9), as in the example",
)
assert by_weight(animals).index.tolist() == [3, 6, 5, 1, 2, 7, 0, 4], "by_weight(animals), as in the example"
check_frame(
    longest_waiting(animals, 4),
    animals.loc[[7, 2, 6, 0]],
    "longest_waiting(animals, 4), as in the example",
)
check_frame(
    adoption_board(animals),
    pd.DataFrame(
        {
            "name": ["Luna", "Ziggy", "Pip", "Mabel", "Bramble", "Shadow", "Clover", "Biscuit"],
            "species": ["cat", "cat", "cat", "dog", "dog", "dog", "rabbit", "rabbit"],
            "days_here": [95, 63, 12, 120, 40, 40, 21, 7],
        }
    ),
    "adoption_board(animals), as in the example",
)
