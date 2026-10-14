The script reads three numbers: `cookies`, the cookies baked (an `int`), `box_size`, how many fit
in one box (an `int`, at least 1), and `price`, what one full box sells for (a `float`). The tests
run your file as a script and type the three lines into it. Replace each `0` in the `YOUR CODE`
block with a calculation that uses those names; the `print` lines are already written.

1. `full_boxes`: how many boxes can be filled completely. It is a whole number.
2. `left_over`: how many cookies remain after the full boxes are packed.
3. `boxes_needed`: how many boxes it takes to pack **every** cookie, the last box possibly part
   full. With no cookies at all, no box is needed.
4. `takings`: the money from selling only the full boxes, `full_boxes` times `price`, rounded to
   2 decimal places.

Example: with 45 cookies, boxes of 6 and a price of 2.5, the script prints:

```text
Full boxes: 7
Left over: 3
Boxes needed: 8
Takings: 17.5
```

Seven boxes hold 42 cookies, three are left over, and they need an eighth box; the seven full
boxes sell for 17.5.

**Tips.** Use `//` and `%` from the lesson's "Floor division and remainder" for tasks 1 and 2:
135 minutes was `135 // 60` hours and `135 % 60` minutes. For task 3, `math` is already
imported, and `math.ceil` rounds up. For task 4 remember why `0.1 + 0.2` is not `0.3`: three
boxes at 0.1 come to `0.30000000000000004` unless you round.
