assert parse("  BACK   5 ") == ("back", 5), "any whitespace and any case are accepted"
assert parse("forward 007") == ("forward", 7), "the steps are converted with int"
assert parse("forward 0") == ("forward", 0), "zero steps is a number like any other"
assert parse("turn right") == ("turn", "right"), "turn right"
assert parse("clean bedroom") == ("clean", ["bedroom"]), "clean with one room gives a list of one room"
assert parse("clean Kitchen  hall Landing") == ("clean", ["kitchen", "hall", "landing"]), "clean keeps every room, in order"
assert parse("DOCK") == ("dock",), "dock alone"
assert isinstance(parse("clean hall")[1], list), "the rooms are a list"

for command in [
    "", "   ", "forward", "forward ten", "forward -3", "forward 3 4", "forward 2.5", "back ²",
    "turn", "turn around", "turn left now", "clean", "dock now", "home sweet home", "left 90", "go forward 3",
]:
    try:
        parse(command)
    except ValueError as error:
        assert str(error) == f"unknown command: {command!r}", "the ValueError message is 'unknown command: ' and the command's repr"
    else:
        raise AssertionError("a command that fits none of the shapes raises ValueError")
