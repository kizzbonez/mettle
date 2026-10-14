# The garage example from the instructions.


@register
@limit(2)
def open_garage(reason):
    """Open the garage door."""
    return f"garage open: {reason}"


assert open_garage("car") == "garage open: car", "the wrapper returns what the original function returns"
assert open_garage.remaining == 1, "remaining goes down by one after a call"
assert open_garage.__name__ == "open_garage", "functools.wraps keeps the function's name"
assert open_garage.__doc__ == "Open the garage door.", "functools.wraps keeps the docstring"
assert ACTIONS["open_garage"] is open_garage, "register stores the function it receives under its name"
assert open_garage(reason="bike") == "garage open: bike", "keyword arguments are passed on"

try:
    open_garage("again")
except RuntimeError as error:
    assert "open_garage" in str(error), "the RuntimeError message names the function"
else:
    raise AssertionError("a third call to a function limited to 2 calls should raise RuntimeError")

try:
    limit(0)
except ValueError:
    pass
else:
    raise AssertionError("limit(0) should raise ValueError")
