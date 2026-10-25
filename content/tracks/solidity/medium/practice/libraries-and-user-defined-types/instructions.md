The roastery's ledger in `solution.sol` keeps every weight as `Grams`, a user-defined value type
over `uint256`. Its operators are attached with a `global` using-for directive, and the roasting
arithmetic lives in the library `Roast`. Write the bodies marked in the starter and keep every
name and signature.

1. **The free functions behind `-` and `==`.** `subGrams(a, b)` returns `a` minus `b` in grams;
   unwrap, subtract with ordinary checked arithmetic, wrap again, so taking more than there is
   reverts with panic 0x11. `equalGrams(a, b)` is true when both hold the same number of grams.
   `+` and `<` are written for you.
2. **`Roast.roasted(Grams green, uint256 lossBps)`** returns the weight left after roasting
   `green` grams that lose `lossBps` basis points of their weight (10,000 bps is 100%), rounded
   down: `green * (10,000 - lossBps) / 10,000`. Multiply before you divide.
3. **`Roast.greenNeeded(Grams target, uint256 lossBps)`** returns the smallest green weight whose
   roasted weight is at least `target`: `target * 10,000 / (10,000 - lossBps)`, **rounded up**.
   Both library functions revert with `LossTooHigh(lossBps)` when `lossBps` is 10,000 or more.
4. **`Roastery.roast(Grams green)`** (roaster only, through the modifier already there) reverts
   with `NotEnoughGreen(greenStock, green)` when the green stock is smaller than `green`.
   Otherwise it works out the roasted weight with the library and the contract's `lossBps`,
   takes `green` off `greenStock`, adds the roasted weight to `roastedStock`, emits
   `Roasted(green, roastedWeight)` and returns the roasted weight.
5. **`Roastery.roastFor(Grams target)`** roasts `greenNeeded(target)` grams by calling `roast`,
   and returns what `roast` returns.

Use `using Roast for Grams` (already in the contract): `green.roasted(lossBps)`.

```solidity
Roastery shop = new Roastery(1_500);    // beans lose 15% of their weight; you are the roaster
shop.receiveGreen(Grams.wrap(5_000));
shop.roast(Grams.wrap(1_000));          // returns 850, emits Roasted(1000, 850)
// greenStock is 4_000, roastedStock is 850
shop.roastFor(Grams.wrap(500));         // roasts 589 green grams (588.2 rounded up), returns 500
// greenStock is 3_411, roastedStock is 1_350
Roast.greenNeeded(Grams.wrap(5), 1_500) // 6: 5 grams would only give 4.25 roasted
shop.roast(Grams.wrap(9_000));          // reverts with NotEnoughGreen(3411, 9000)
```
