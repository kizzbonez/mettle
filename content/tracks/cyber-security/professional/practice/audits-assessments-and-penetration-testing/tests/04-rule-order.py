# review_plan: which rule wins when several apply, blank lines, and an empty plan.
with open("t4-plan.csv", "w") as f:
    f.write(
        "id,time,target,technique\n"
        "O-1,2026-11-30T03:00:00Z,10.40.1.1,denial-of-service\n"
        "O-2,2026-11-10T10:00:00Z,198.51.100.9,wifi-cracking\n"
        "O-3,2026-11-30T03:00:00Z,198.51.100.9,port-scan\n"
        "\n"
        "O-4,2026-11-10T10:00:00Z,10.40.1.1,data-deletion\n"
        "O-5,2026-11-20T17:59:59Z,10.40.3.3,exploit\n"
    )
got = review_plan("data/roe.json", "t4-plan.csv")
assert got == [
    "O-1 refused: forbidden technique",
    "O-2 refused: unknown technique",
    "O-3 refused: out of scope",
    "O-4 refused: forbidden technique",
    "O-5 approved",
], "forbidden before unknown before scope before window, with a blank line in the plan"

with open("t4-empty.csv", "w") as f:
    f.write("id,time,target,technique\n")
assert review_plan("data/roe.json", "t4-empty.csv") == [], "a plan with only its header gives an empty list"
