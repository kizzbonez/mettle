import pandas as pd

screenings = pd.read_csv("data/screenings.csv")
before = screenings.copy()

check_frame(
    takings_by_film(screenings),
    pd.Series(
        [2880.0, 2232.0, 1570.0, 360.0],
        index=pd.Index(["Moon Garden", "Rocket Dog", "Night Ferry", "Quiet Harbour"], name="film"),
        name="takings",
    ),
    "takings_by_film of the sample screenings",
)
check_frame(
    film_report(screenings),
    pd.DataFrame(
        {
            "film": ["Moon Garden", "Rocket Dog", "Night Ferry", "Quiet Harbour"],
            "screenings": [3, 3, 2, 2],
            "tickets": [288, 279, 157, 40],
            "avg_rating": [4.30, 4.55, 4.00, 4.80],
            "rated": [2, 2, 2, 1],
        }
    ),
    "film_report of the sample screenings",
)
check_frame(
    per_screen_day(screenings),
    pd.DataFrame(
        {
            "screen": [1, 1, 1, 2, 2, 2],
            "day": ["Fri", "Sat", "Sun", "Fri", "Sat", "Sun"],
            "avg_tickets": [41.0, 120.0, 82.5, 88.0, 96.0, 58.5],
        }
    ),
    "per_screen_day of the sample screenings",
)
counts = screenings_per_day(screenings)
assert list(counts.index) == ["Sun", "Fri", "Sat"] and counts.tolist() == [4, 3, 3], "screenings_per_day of the sample screenings"
check_frame(screenings, before, "the functions leave screenings as it was")
