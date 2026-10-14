taken = {"5A"}
assert book([], taken) == [] and taken == {"5A"}, "an empty basket books nothing"
assert book(["5b", " 6C "], taken) == ["5B", "6C"], "book returns the seats in normal form, in request order"
assert taken == {"5A", "5B", "6C"}, "the booked seats are added to taken"


def failures(requests, taken):
    try:
        book(requests, taken)
    except ExceptionGroup as group:
        return group
    raise AssertionError("a basket with a problem raises an ExceptionGroup")


before = set(taken)
group = failures(["7A", "5A", "99Z", "7a", "abc", "8F"], taken)
assert group.message == "booking failed", "the group's message is 'booking failed'"
kinds = [type(error).__name__ for error in group.exceptions]
assert kinds == ["SeatTakenError", "BadSeatError", "SeatTakenError", "BadSeatError"], (
    "the group holds one error per bad request, in request order"
)
assert [error.__notes__ for error in group.exceptions] == [
    ["request 2: '5A'"],
    ["request 3: '99Z'"],
    ["request 4: '7a'"],
    ["request 5: 'abc'"],
], "each error gets the note 'request N: TEXT', numbered from 1"
assert group.exceptions[2].seat == "7A", "a seat asked for twice in one basket is taken the second time"
assert taken == before, "a failed basket books nothing, not even its good seats"

single = failures(["6C"], taken)
assert len(single.exceptions) == 1 and single.exceptions[0].seat == "6C", "even a single problem is reported in a group"

handled = []
try:
    book(["1A", "1a", "31A"], set())
except* SeatTakenError as group:
    handled.append(("taken", [error.seat for error in group.exceptions]))
except* ValueError as group:
    handled.append(("value", [error.text for error in group.exceptions]))
assert handled == [("taken", ["1A"]), ("value", ["31A"])], "except* sorts the group's errors by their classes"
