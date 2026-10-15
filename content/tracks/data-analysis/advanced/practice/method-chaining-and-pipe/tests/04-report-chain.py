import ast

import pandas as pd

with open("chain-donations.csv", "w", encoding="utf-8") as file:
    file.write(
        "Donor Name,Item Type,Weight (g),Date\n"
        "A,soup,1250,2026-11-02\n"
        "B,beans,750,2026-11-02\n"
        "C,soup,,2026-11-03\n"
        "D,beans,1250,2026-11-03\n"
        "E,flour,300,2026-11-03\n"
        "F,soup,750,2026-11-04\n"
        "G,beans,1000,2026-11-04\n"
        "H,oil,2000,2026-11-05\n"
        "I,oil,1,2026-11-05\n"
        "J,flour,,2026-11-06\n"
        "K,rice,1234,2026-11-06\n"
        "L,rice,2005,2026-11-07\n"
    )

expected = pd.DataFrame(
    {"donations": [2, 3, 1, 2], "total_kg": [3.24, 3.0, 2.0, 2.0]},
    index=pd.Index(["rice", "beans", "oil", "soup"], name="item_type"),
)
check_frame(
    report("chain-donations.csv", 0.75),
    expected,
    "report drops missing weights, keeps donations of at least min_kg, and sorts by total_kg with ties by item type",
)

nothing = report("chain-donations.csv", 5)
assert isinstance(nothing, pd.DataFrame) and len(nothing) == 0, "report with no donation heavy enough has no rows"
assert nothing.columns.tolist() == ["donations", "total_kg"], "an empty report still has its two columns"

with open("solution.py", encoding="utf-8") as file:
    tree = ast.parse(file.read())
functions = {node.name: node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)}
assert "report" in functions, "solution.py defines report with def"
body = functions["report"].body
if body and isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant):
    body = body[1:]
assert len(body) == 1 and isinstance(body[0], ast.Return), "the body of report is a single return statement: one chain"
piped = [
    arg.id
    for node in ast.walk(body[0])
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "pipe"
    for arg in node.args[:1]
    if isinstance(arg, ast.Name)
]
assert "tidy_names" in piped and "drop_small" in piped, "report calls tidy_names and drop_small with pipe"
assert not any(isinstance(node, ast.keyword) and node.arg == "inplace" for node in ast.walk(tree)), (
    "solution.py does not use inplace"
)
