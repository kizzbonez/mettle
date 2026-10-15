week = ride_report([14.0, 22.5, 9.0, 31.0])
assert week["shape"] == (4,), "the shape of a log for one member is a tuple with one length"
assert week["size"] == 4, "the size of a log for one member"

club = ride_report([[10, 25, 40], [5, 30, 18], [60, 12, 0], [7, 7, 7]])
assert club["shape"] == (4, 3), "the shape lists the rows first, then the columns"
assert club["size"] == 12, "the size counts every distance in every row, not just the rows"

solo = ride_report([[26.2]])
assert solo["shape"] == (1, 1), "the shape of a log with one member and one ride"
assert solo["size"] == 1, "the size of a log with one ride"

wide = ride_report([[1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0]])
assert wide["shape"] == (1, 7) and wide["size"] == 7, "shape and size of a log with one member over seven Sundays"
