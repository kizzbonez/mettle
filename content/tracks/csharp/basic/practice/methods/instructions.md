Now that you can write methods, you write their bodies yourself. The starter declares the four
methods of the class `Laundromat` that the tests call. Keep each first line, the signature,
exactly as it is, and replace each `throw new NotImplementedException();` with your code. You
may add `private static` helper methods of your own.

1. `WashersNeeded(int kilos, int capacity = 8)` is the number of washers the laundry needs, when
   each washer takes `capacity` kilograms: a part-full washer still counts. No laundry needs no
   washer. The tests always pass a capacity of 1 or more.
2. `Price(int washers, bool dry = false)` is 4.50 for each washer, plus 2.00 for each washer when
   `dry` is `true`. It fits on one line as an expression-bodied method.
3. `TryReadKilos(string text, out int kilos)` reads what a customer typed. When `text` is a
   whole number of 1 or more, possibly with spaces around it, `kilos` is that number and the
   method returns `true`. Otherwise `kilos` is `0` and the method returns `false`.
4. `PayWithCard(ref decimal balance, decimal cost)` pays from the caller's card. When `balance`
   is at least `cost`, subtract `cost` from it and return `true`. Otherwise leave `balance` as it
   is and return `false`.

Example:

```csharp
Laundromat.WashersNeeded(20)                  // 3
Laundromat.WashersNeeded(20, capacity: 10)    // 2
Laundromat.Price(3)                           // 13.50
Laundromat.Price(3, dry: true)                // 19.50
Laundromat.TryReadKilos(" 12 ", out int kilos)  // true, and kilos is 12
Laundromat.TryReadKilos("lots", out kilos)      // false, and kilos is 0

decimal balance = 20.00m;
Laundromat.PayWithCard(ref balance, 13.50m)   // true, and balance is now 6.50
Laundromat.PayWithCard(ref balance, 13.50m)   // false, and balance is still 6.50
```

**Tip:** the compiler insists that every path through `TryReadKilos` assigns `kilos`, and that
every path through a method with a return type returns a value. Read its CS0177 and CS0161
errors as the lesson shows.
