assert totals({}) == {}, "with no pupils, totals is an empty dict"
assert missed_a_day({}) == set(), "with no pupils, missed_a_day is an empty set"

logs = {"Zoe": [0, 0], "Yusuf": [], "Xin": [7], "Wren": [3, 0, 4, 0]}
before = {name: list(pages) for name, pages in logs.items()}
result = totals(logs)
assert result == {"Zoe": 0, "Yusuf": 0, "Xin": 7, "Wren": 7}, "totals adds up every day of every pupil"
assert list(result) == ["Zoe", "Yusuf", "Xin", "Wren"], "totals keeps the pupils in the order of logs"

missed = missed_a_day(logs)
assert isinstance(missed, set), "missed_a_day returns a set"
assert missed == {"Zoe", "Wren"}, "missed_a_day holds each pupil with a day of 0 pages, once"
assert "Yusuf" not in missed, "a pupil with no days logged has not missed a day"
assert missed_a_day({"Ola": [1, 2, 3]}) == set(), "a pupil who read every day has not missed one"
assert logs == before, "logs is not changed"
