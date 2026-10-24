Finish the quote in `solution.go`. The constants and the two package-level variables are given;
keep their names. The tests run your program and also change `widthCm` and `lengthCm` and call
`main` again, so work everything out from them. Add `"math"` and `"strconv"` to the imports.

In `main`, replace each placeholder value with its calculation:

1. **`ref`** (a string): `Q-`, the width, `x` and the length, such as `Q-340x275`. Turn the numbers
   into text with `strconv.Itoa`.
2. **`area`** (a `float64`): the floor area in square metres, rounded to two decimal places.
   Multiply the two lengths, convert to `float64`, divide by 10000 (the square centimetres in a
   square metre), then round with `math.Round(x*100) / 100`.
3. **`across`** and **`along`** (`int`s): how many tiles fit across the width and along the
   length. A row that ends in part of a tile still needs a whole tile, so round **up** with
   `math.Ceil` and convert the result to `int`. 340 cm needs 14 tiles (13.6 rounded up); 275 cm
   needs exactly 11.
4. **`total`**: `across` times `along`.
5. **`boxes`**: how many boxes of `tilesPerBox` the shop sells, again rounded **up**, and
   **`spare`**: how many tiles from those boxes are left over. When `total` divides exactly,
   there are no extra boxes and no spare tiles.
6. **`price`** (a string): `boxes` times `boxPrice`, written with exactly two decimals by
   `strconv.FormatFloat(value, 'f', 2, 64)`.

Remember that Go never mixes `int` and `float64` by itself: convert with `float64(...)` and
`int(...)` where the types differ. For the starter's room the program prints:

```text
Quote Q-340x275
Floor area: 9.35 square metres
Tiles: 14 across, 11 along, 154 in all
Boxes: 13 with 2 tiles spare
Price: 409.50 euros
```

A room of 300 by 250 cm needs 12 by 10 = 120 tiles: 10 boxes with 0 tiles spare, an area of 7.5
square metres and a price of `315.00`.
