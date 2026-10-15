import pandas as pd

animals = pd.DataFrame(
    {
        "name": ["Hazel", "Otis", "Juniper", "Nugget", "Pepper", "Willow", "Rolo"],
        "species": ["rabbit", "dog", "cat", "rabbit", "cat", "dog", "dog"],
        "age_years": [2.0, 1.0, 7.5, 3.0, 12.0, 5.0, 0.8],
        "weight_kg": [2.2, 9.5, 5.0, None, 4.4, 27.0, 6.1],
        "days_here": [14, 3, 88, 30, 150, 41, 9],
        "vaccinated": [True, True, True, True, True, False, True],
        "reserved": [False, False, True, False, False, False, False],
    },
    index=["T31", "T07", "T12", "T44", "T02", "T19", "T25"],
)
before = animals.copy()

check_frame(
    available(animals, ["dog", "rabbit"], 1.0, 5.0),
    animals.loc[["T31", "T07", "T44"]],
    "both ages are included, unvaccinated animals are left out, and the rows keep their labels and order",
)
check_frame(
    available(animals, ["cat"], 0, 20),
    animals.loc[["T02"]],
    "a reserved animal is never available",
)
check_frame(
    available(animals, ["dog", "cat", "rabbit"], 0, 1),
    animals.loc[["T07", "T25"]],
    "an animal of exactly max_age is kept",
)
none = available(animals, ["dog"], 6, 9)
assert len(none) == 0 and list(none.columns) == list(animals.columns), "no match gives an empty frame with the same columns"
nobody = available(animals, [], 0, 20)
assert len(nobody) == 0, "an empty species list matches no animal"
check_frame(animals, before, "available does not change the frame it is given")
