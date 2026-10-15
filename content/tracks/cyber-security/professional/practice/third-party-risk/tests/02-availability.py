# availability: notice exactly 5 days, short notice, midnight, seconds, other month lengths.
with open("t2-outages.csv", "w") as f:
    f.write(
        "start,end,kind,notice_days\n"
        "2026-11-02T23:50:00Z,2026-11-03T00:20:00Z,unplanned,\n"
        "2026-11-07T02:00:00Z,2026-11-07T04:00:00Z,maintenance,5\n"
        "2026-11-14T02:00:00Z,2026-11-14T02:45:00Z,maintenance,4\n"
        "\n"
        "2026-11-20T10:00:30Z,2026-11-20T10:13:00Z,unplanned,0\n"
    )
got = availability("t2-outages.csv", 30)
assert got == 99.797, (
    "a 30-day month: maintenance with 5 days' notice excluded, 4 days' notice counted, "
    "an outage over midnight and one with seconds"
)

with open("t2-none.csv", "w") as f:
    f.write("start,end,kind,notice_days\n")
assert availability("t2-none.csv", 31) == 100.0, "a month without outages is 100.0 percent"

with open("t2-february.csv", "w") as f:
    f.write("start,end,kind,notice_days\n2027-02-11T08:00:00Z,2027-02-11T12:00:00Z,unplanned,\n")
assert availability("t2-february.csv", 28) == 99.405, "a 28-day month with a four-hour outage, rounded to 3 decimals"
