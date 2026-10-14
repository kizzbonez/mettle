# register: stores functions by name, returns them unchanged and refuses duplicates.


def water_plants():
    return "watered"


returned = register(water_plants)
assert returned is water_plants, "register returns the very function it received"
assert ACTIONS.get("water_plants") is water_plants, "register stores the function under its __name__"


@register
def lock_doors():
    return "locked"


assert lock_doors() == "locked", "a registered function still works as before"
assert list(ACTIONS) == ["water_plants", "lock_doors"], "every registered function is in ACTIONS, in order"


def lock_doors():
    return "a second function with the same name"


try:
    register(lock_doors)
except ValueError:
    pass
else:
    raise AssertionError("registering a second function under a name already used should raise ValueError")
assert ACTIONS["lock_doors"]() == "locked", "a refused registration leaves the first function in ACTIONS"
assert len(ACTIONS) == 2, "a refused registration adds nothing"


@limit(1)
@register
def feed_cat():
    return "fed"


assert ACTIONS["feed_cat"] is feed_cat.__wrapped__, "with register below limit, the plain function is registered"
assert feed_cat() == "fed", "the limited function runs once"
assert ACTIONS["feed_cat"]() == "fed", "the registered plain function is not limited"
