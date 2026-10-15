# read_hives cleans and joins the register, validates the apiaries, and unknown_scales finds stray scales.
from pathlib import Path

import pandas as pd

hives = read_hives("data/hives.csv", "data/apiaries.csv")
expected = pd.DataFrame({
    "hive_id": ["H01", "H02", "H03", "H04", "H05", "H06", "H07", "H08"],
    "colony": ["Clover", "Bramble", "Juniper", "Gorse", "Sorrel", "Linden", "Marigold", "Thyme"],
    "apiary": ["Pear Tree Orchard"] * 3 + ["Ridgeway Heath"] * 2 + ["Market Hall Roof"] * 2 + ["Ridgeway Heath"],
    "site": ["orchard"] * 3 + ["heath"] * 2 + ["rooftop"] * 2 + ["heath"],
})
check_frame(hives, expected, "read_hives cleans hive_id, joins each hive to its apiary and keeps the stated columns in order")

Path("register.csv").write_text(
    "hive_id,apiary_id,colony,installed\n"
    "h11 ,NEW,Primrose,2026-05-01\n"
    " H10,ORC,Damson,2026-04-02\n",
    encoding="utf-8",
)
Path("one-apiary.csv").write_text("apiary_id,name,site\nORC,Pear Tree Orchard,orchard\n", encoding="utf-8")
partial = read_hives("register.csv", "one-apiary.csv")
expected_partial = pd.DataFrame({
    "hive_id": ["H10", "H11"],
    "colony": ["Damson", "Primrose"],
    "apiary": ["Pear Tree Orchard", None],
    "site": ["orchard", None],
})
check_frame(partial, expected_partial, "a hive whose apiary is not listed is kept, with apiary and site missing")

Path("twice.csv").write_text(
    "apiary_id,name,site\nORC,Pear Tree Orchard,orchard\nORC,Old Orchard,orchard\n",
    encoding="utf-8",
)
try:
    read_hives("register.csv", "twice.csv")
except pd.errors.MergeError:
    pass
else:
    raise AssertionError("read_hives raises pandas.errors.MergeError when an apiary_id is listed twice")

june = read_scales("data/scales-june.csv")
none_unknown = unknown_scales(june, hives)
assert isinstance(none_unknown, pd.Series), "unknown_scales returns a Series"
assert len(none_unknown) == 0, "unknown_scales is empty when every scale in the file is registered"
assert none_unknown.name == "readings" and none_unknown.index.name == "hive_id", (
    "an empty result still has the name readings and the index name hive_id"
)

readings = pd.DataFrame({
    "time": pd.to_datetime(["2026-05-01 06:30"] * 5).tz_localize("Europe/London"),
    "hive_id": ["H01", "TEST-B", "TEST-A", "TEST-B", "H02"],
    "weight_kg": [30.0, 1.0, 2.0, 1.1, 31.0],
})
expected_unknown = pd.Series([1, 2], index=pd.Index(["TEST-A", "TEST-B"], name="hive_id"), name="readings")
check_frame(unknown_scales(readings, hives), expected_unknown, "unknown_scales counts each stray scale once per reading, sorted by hive_id")
