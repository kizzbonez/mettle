import ast

with open("solution.py", encoding="utf-8") as file:
    tree = ast.parse(file.read())
functions = {node.name: node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)}
built = (ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp)

for name in ["totals", "missed_a_day", "entries", "busiest_day"]:
    assert name in functions, f"solution.py defines {name} with def"
    body = functions[name].body
    if body and isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant):
        body = body[1:]
    assert len(body) == 1 and isinstance(body[0], ast.Return), f"the body of {name} is a single return statement"
    assert any(isinstance(node, built) for node in ast.walk(body[0])), (
        f"{name} returns something built with a comprehension or a generator expression"
    )

assert isinstance(totals({"Ana": [1]}), dict), "totals returns a dict"
assert isinstance(entries({"Ana": [1]}), list), "entries returns a list"
