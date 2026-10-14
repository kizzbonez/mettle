def results(names, times):
    ran = run_script(stdin=f"{names}\n{times}\n")
    assert ran.code == 0, "the script runs to the end without an error"
    return ran.out.split("\n")


lines = results("Kai Lin Max", "1800 1200 1500")
assert lines[:3] == ["1. Lin 20:00", "2. Max 25:00", "3. Kai 30:00"], (
    "the runners are listed fastest first, each with the time that belongs to them"
)

lines = results("Mo Al Zed", "900 900 899")
assert lines[:3] == ["1. Zed 14:59", "2. Al 15:00", "3. Mo 15:00"], (
    "runners with the same time are listed in the order of their names"
)

lines = results("Zoë Åsa Émile", "2400 2100 1990")
assert lines[:3] == ["1. Émile 33:10", "2. Åsa 35:00", "3. Zoë 40:00"], "names with accented letters are kept as typed"

lines = results("  Ines   Rob ", "  700   650  ")
assert lines[:2] == ["1. Rob 10:50", "2. Ines 11:40"], "extra spaces between and around the names and times are ignored"
