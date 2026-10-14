Write the two functions of `solution.py`, each with a `match` statement (a hidden test checks
that each one contains `match`). The starter defines the class `Bump`, whose `__match_args__`
is `("x", "y")`; keep it.

1. **`parse(command)`** lower-cases the command, splits it on whitespace, and matches the list
   of words:
   - `forward N` or `back N`, where `N` is made only of decimal digits: return
     `("forward", N)` or `("back", N)` with `N` as an `int`;
   - `turn left` or `turn right`: return `("turn", "left")` or `("turn", "right")`;
   - `clean` followed by one or more rooms: return `("clean", ROOMS)`, a list of the room
     words;
   - `dock` or `home`, alone: return `("dock",)`;
   - anything else raises `ValueError` with the message `unknown command: COMMAND`, the
     original command shown by its `repr`.
2. **`report(message)`** turns a message from the robot into text. Try these in order:
   - a dict with `"event": "battery"` and an **int** `"level"` below 20: `battery low: LEVEL%`;
   - a dict with `"event": "battery"` and any other **int** `"level"`: `battery LEVEL%`;
   - a dict with `"event": "stuck"` and a **str** `"room"`: `stuck in the ROOM`;
   - a dict with `"event": "bin"` and `"full": True`: `empty the bin`; with `"full": False`:
     `bin ok`;
   - a `Bump` at `x` 0 and `y` 0: `bumped into the dock`; any other `Bump`:
     `bumped into something at X,Y`;
   - any other dict whose `"event"` is a str: `ignored EVENT event`;
   - anything else: `not a message`.

   Extra keys in a dict do not matter.

Example:

```python
parse("forward 30")                 # ('forward', 30)
parse("Turn LEFT")                  # ('turn', 'left')
parse("clean kitchen hall")         # ('clean', ['kitchen', 'hall'])
parse("home")                       # ('dock',)
parse("dance")                      # raises ValueError: unknown command: 'dance'
report({"event": "battery", "level": 15})        # 'battery low: 15%'
report({"event": "stuck", "room": "hall"})       # 'stuck in the hall'
report(Bump(2, 5))                               # 'bumped into something at 2,5'
report({"event": "battery", "level": "low"})     # 'ignored battery event'
report(["battery", 15])                          # 'not a message'
```

**Tips.** `("left" | "right") as side` keeps which word matched, `*rooms` captures the rest of a
sequence, and a guard (`if ...`) checks what a pattern cannot. `int(level)` in a pattern
matches only an `int` and binds it. A bare name always captures, so the literal `0` in
`Bump(0, 0)` is what makes that case specific.
