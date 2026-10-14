import ast

assert report(Bump(0, 0)) == "bumped into the dock", "a Bump at 0, 0 is the dock"
assert report(Bump(0, 4)) == "bumped into something at 0,4", "a Bump with only x at 0 is not the dock"
assert report(Bump(3, 0)) == "bumped into something at 3,0", "a Bump with only y at 0 is not the dock"
assert report(Bump(-1, 12)) == "bumped into something at -1,12", "a Bump anywhere else reports its position"


class SoftBump(Bump):
    pass


assert report(SoftBump(0, 0)) == "bumped into the dock", "a subclass of Bump matches the Bump patterns"


class FakeBump:
    __match_args__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y


assert report(FakeBump(1, 1)) == "not a message", "an object of another class is not a message"
for other in [None, "battery", 15, ("event", "battery"), ["battery", 15], {"battery", "low"}]:
    assert report(other) == "not a message", "anything that is not a known dict or a Bump is not a message"

with open("solution.py", encoding="utf-8") as file:
    tree = ast.parse(file.read())
functions = {node.name: node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)}
for name in ["parse", "report"]:
    assert name in functions, f"solution.py defines {name} with def"
    assert any(isinstance(node, ast.Match) for node in ast.walk(functions[name])), f"{name} uses a match statement"
