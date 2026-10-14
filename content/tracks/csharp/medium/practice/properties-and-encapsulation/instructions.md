The constructors are complete. Write the parts marked with `TODO` and
`throw new NotImplementedException();`.

1. **`Slot`** has two properties with a short `get;` and a setter that checks the value through
   the `field` keyword. The constructor assigns through these setters, so the rules hold from the
   start.
   - `Price`: a price that is zero or less is refused with `ArgumentOutOfRangeException`, and the
     old price stays.
   - `Stock`: a negative number is stored as `0`.
2. **`VendingMachine.Credit`** is the money inserted and not yet spent. Anyone can read it, but
   only the machine can change it: give it a setter that outside code cannot use.
   - `Insert(decimal coin)` adds the coin to the credit. The machine takes `0.10`, `0.20`, `0.50`,
     `1` and `2`. Any other amount throws `ArgumentException` and leaves the credit as it was.
   - `Refund()` returns the whole credit and sets `Credit` back to `0`.
3. **The indexer** `this[int number]` reads and writes the slots, numbered from `1`. An empty slot
   is `null`, and assigning `null` empties a slot. A number outside the machine throws
   `ArgumentOutOfRangeException`, for reading and for writing.
4. **`Restock(int number, int amount)`** adds `amount` to the stock of that slot. An empty slot is
   skipped without an error. Write it in one line with null-conditional assignment, so that the
   `Stock` setter still applies its rule. A number outside the machine throws as the indexer does.

Example:

```csharp
var machine = new VendingMachine(3);
machine[1] = new Slot("Water", 0.90m, 5);
machine[2] = new Slot("Crisps", 1.20m, 0);
machine[1]!.Product          // "Water"
machine[3]                   // null: an empty slot
machine[4]                   // throws ArgumentOutOfRangeException

machine.Insert(1m);
machine.Insert(0.20m);
machine.Credit               // 1.20
machine.Insert(0.05m);       // throws ArgumentException: the machine does not take it

machine[2]!.Stock = -4;      // stored as 0
machine.Restock(2, 6);       // Crisps now has 6
machine.Restock(3, 6);       // an empty slot: nothing happens
machine[1]!.Price = 0m;      // throws ArgumentOutOfRangeException; the price stays 0.90

machine.Refund()             // 1.20, and Credit is 0 again
```
