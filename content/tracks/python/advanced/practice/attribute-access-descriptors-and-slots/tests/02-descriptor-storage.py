# Bounded keeps each instance's value in that instance, under the private name.
reef = Tank("reef", 26, 8.1)
pond = Tank("pond", 19, 7.0)
assert (reef.temperature, pond.temperature) == (26, 19), "each tank keeps its own temperature"
reef.temperature = 28
assert (reef.temperature, pond.temperature) == (28, 19), "changing one tank does not change another"
assert vars(pond) == {"name": "pond", "_temperature": 19, "_ph": 7.0}, "values live in the instance's __dict__ under '_' + name"


class Lamp:
    watts = Bounded(1, 60)
    hours = Bounded(0, 24)


desk, shelf = Lamp(), Lamp()
desk.watts = 40
shelf.watts = 7
desk.hours = 0
assert (desk.watts, shelf.watts, desk.hours) == (40, 7, 0), "the descriptor works on any class and attribute name"
assert vars(desk) == {"_watts": 40, "_hours": 0}, "the private names come from the attribute names given to __set_name__"
assert isinstance(Lamp.watts, Bounded) and Lamp.watts is not Lamp.hours, "on the class each attribute gives its own descriptor"
assert (Lamp.watts.low, Lamp.watts.high) == (1, 60), "the descriptor keeps its bounds"

vars(desk)["watts"] = 999
assert desk.watts == 40, "a data descriptor wins over an entry with the same name in the instance __dict__"
desk.watts = 60
assert vars(desk)["_watts"] == 60, "assignment goes through the descriptor even then"
