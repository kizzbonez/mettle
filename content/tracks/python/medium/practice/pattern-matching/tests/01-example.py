assert parse("forward 30") == ("forward", 30), "parse('forward 30'), as in the example"
assert parse("Turn LEFT") == ("turn", "left"), "parse('Turn LEFT'), as in the example"
assert parse("clean kitchen hall") == ("clean", ["kitchen", "hall"]), "parse('clean kitchen hall'), as in the example"
assert parse("home") == ("dock",), "parse('home'), as in the example"
try:
    parse("dance")
except ValueError as error:
    assert str(error) == "unknown command: 'dance'", "the message of the ValueError for 'dance', as in the example"
else:
    raise AssertionError("parse('dance') raises ValueError, as in the example")

assert report({"event": "battery", "level": 15}) == "battery low: 15%", "report of a low battery, as in the example"
assert report({"event": "stuck", "room": "hall"}) == "stuck in the hall", "report of being stuck, as in the example"
assert report(Bump(2, 5)) == "bumped into something at 2,5", "report of Bump(2, 5), as in the example"
assert report({"event": "battery", "level": "low"}) == "ignored battery event", "report of a battery level that is not an int, as in the example"
assert report(["battery", 15]) == "not a message", "report of a list, as in the example"
