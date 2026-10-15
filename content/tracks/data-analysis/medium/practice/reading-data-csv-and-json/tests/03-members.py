from pathlib import Path

import pandas as pd

Path("members-new.csv").write_text(
    "001,Elif Şahin,road\n250,Tomás Ruiz,gravel\n010,Ida Berg,mountain\n",
    encoding="utf-8",
)
members = read_members("members-new.csv")
assert isinstance(members, pd.DataFrame), "read_members returns a DataFrame"
assert len(members) == 3, "the first line of a file without a header is a member, not the header"
assert list(members.columns) == ["name", "group"], "read_members has the columns name and group"
check_frame(
    members.index,
    pd.Index(["001", "250", "010"], name="member"),
    "the index holds the member numbers as text, with their leading zeros, in file order, and is named member",
)
assert members.loc["250", "name"] == "Tomás Ruiz" and members.loc["001", "group"] == "road", (
    "names and groups are found by member number"
)
assert str(members["name"].dtype) == "str" and str(members["group"].dtype) == "str", "name and group are str columns"

Path("members-one.csv").write_text("042,Sam Lee,road\n", encoding="utf-8")
one = read_members("members-one.csv")
assert one.shape == (1, 2) and one.index.tolist() == ["042"], "a list of one member gives one row indexed by its number"
