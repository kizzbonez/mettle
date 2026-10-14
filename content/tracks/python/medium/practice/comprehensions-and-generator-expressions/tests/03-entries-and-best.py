assert entries({}) == [], "with no pupils there are no entries"
assert busiest_day({}) == 0, "with no pupils the busiest day is 0"
assert busiest_day({"Ana": [], "Bo": []}) == 0, "when no day was logged the busiest day is 0"
assert entries({"Ana": [0, 0]}) == [], "days with 0 pages are not entries"
assert busiest_day({"Ana": [0, 0]}) == 0, "a log of only zero days has a busiest day of 0"

logs = {"Pia": [0, 0, 9], "Ola": [4], "Ken": [], "Jo": [2, 15, 15]}
assert entries(logs) == [("Pia", 3, 9), ("Ola", 1, 4), ("Jo", 1, 2), ("Jo", 2, 15), ("Jo", 3, 15)], (
    "entries keeps the order of logs, then of the days, numbers days from 1 and skips days of 0 pages"
)
assert busiest_day(logs) == 15, "busiest_day looks at every day of every pupil"
assert busiest_day({"Max": [3], "Sam": [40, 1]}) == 40, "the busiest day can belong to any pupil"
assert busiest_day({"Solo": [8]}) == 8, "a single day is the busiest day"
assert isinstance(entries(logs)[0], tuple), "each entry is a tuple"
