Complete the class `VendingMachine`. Keep every public name, parameter and type as it is. Slots
are numbered from 1, and slot 1 is `_stock[0]`. `Slots` and `StockOf` are already complete.

1. The constructor `VendingMachine(int slots, int itemsPerSlot)` throws
   `ArgumentOutOfRangeException` when `slots` is less than 1 or when `itemsPerSlot` is negative.
   Otherwise it creates the stock so that every slot holds `itemsPerSlot` items. A machine whose
   slots start empty is allowed.
2. `Buy(int slot)` takes one item out of a slot. Check in this order, and throw at the first
   problem:
   - the slot is not between 1 and `Slots`: `ArgumentOutOfRangeException`;
   - the slot is empty: `InvalidOperationException`.

   The message of each exception must contain the slot number, such as `Slot 7 does not exist.`
   A `Buy` that throws changes nothing.
3. `Press(int slot)` is the button on the front. It calls `Buy` inside `try` and returns one of
   these texts:
   - `Enjoy!` when `Buy` worked;
   - `Slot N does not exist` when `Buy` threw `ArgumentOutOfRangeException`;
   - `Slot N is sold out` when `Buy` threw `InvalidOperationException`.

   `N` is the slot number. `Press` never lets either exception escape.

Example:

```csharp
var machine = new VendingMachine(3, 2);
machine.Buy(2);
machine.Buy(2);
machine.StockOf(2)          // 0
machine.Buy(2);             // throws InvalidOperationException
machine.Press(2)            // "Slot 2 is sold out"
machine.Press(5)            // "Slot 5 does not exist"
machine.Press(1)            // "Enjoy!"
machine.StockOf(1)          // 1
new VendingMachine(0, 5);   // throws ArgumentOutOfRangeException
```

**Tip:** the order of the checks in `Buy` matters. On a machine with 3 slots, `Buy(9)` must be
refused as a slot that does not exist before anything reads `_stock`, or the array itself throws
a different exception.
