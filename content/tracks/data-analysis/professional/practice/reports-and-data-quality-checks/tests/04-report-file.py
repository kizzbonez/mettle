from pathlib import Path

import pandas as pd

visits = pd.DataFrame({
    "day": pd.to_datetime(["2026-09-20", "2026-09-14", "2026-09-15", "2026-09-14"]),
    "museum": ["Zoo", "Musée Rodin", "Zoo", "Musée Rodin"],
    "ticket": ["adult", "child", "adult", "adult"],
    "visitors": [3, 89, 5, 1_234_567],
})
path = Path("report-week-38.txt")
path.write_text("an old report that must go\n" * 20, encoding="utf-8")

write_report(str(path), visits, visits)
assert path.read_bytes().decode("utf-8") == (
    "Museum visitors, 2026-09-14 to 2026-09-20\n"
    "\n"
    "ticket          adult child     Total  share\n"
    "museum                                      \n"
    "Musée Rodin 1,234,567    89 1,234,656 100.0%\n"
    "Zoo                 8     0         8   0.0%\n"
    "Total       1,234,575    89 1,234,664 100.0%\n"
    "\n"
    "Data checks:\n"
    "  - none\n"
), "write_report replaces the old file with the first and last day, the table and '  - none' when all checks pass, in UTF-8"

earlier = pd.DataFrame({
    "day": pd.to_datetime(["2026-09-07"] * 3),
    "museum": ["Zoo", "Aquarium", "Zoo"],
    "ticket": ["adult", "adult", "child"],
    "visitors": [10, 20, 30],
})
write_report(str(path), earlier, visits)
lines = path.read_text(encoding="utf-8").split("\n")
assert lines[-5:] == [
    "Data checks:",
    "  - row count 3 -> 4 (+33%)",
    "  - museum: new value(s) Musée Rodin",
    "  - museum: missing value(s) Aquarium",
    "",
], "write_report lists every warning of batch_warnings, one per line, after 'Data checks:'"
