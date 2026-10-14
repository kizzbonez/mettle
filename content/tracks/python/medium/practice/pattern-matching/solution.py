"""Robot Vacuum: read the app's commands and the robot's messages with match."""


class Bump:
    """The bump sensor hit something at the point (x, y)."""

    __match_args__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y


def parse(command):
    """('forward', N), ('back', N), ('turn', SIDE), ('clean', ROOMS) or ('dock',)."""
    match command.lower().split():
        case [("forward" | "back") as direction, steps] if steps.isdecimal():
            return direction, int(steps)
        case ["turn", ("left" | "right") as side]:
            return "turn", side
        case ["clean", *rooms] if rooms:
            return "clean", rooms
        case ["dock"] | ["home"]:
            return ("dock",)
        case _:
            raise ValueError(f"unknown command: {command!r}")


def report(message):
    """The text for a battery, stuck, bin or Bump message, or 'not a message'."""
    match message:
        case {"event": "battery", "level": int(level)} if level < 20:
            return f"battery low: {level}%"
        case {"event": "battery", "level": int(level)}:
            return f"battery {level}%"
        case {"event": "stuck", "room": str(room)}:
            return f"stuck in the {room}"
        case {"event": "bin", "full": True}:
            return "empty the bin"
        case {"event": "bin", "full": False}:
            return "bin ok"
        case Bump(0, 0):
            return "bumped into the dock"
        case Bump(x, y):
            return f"bumped into something at {x},{y}"
        case {"event": str(kind)}:
            return f"ignored {kind} event"
        case _:
            return "not a message"
