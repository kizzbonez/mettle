The tests call the four methods of the class `EggFarm`. As in the last lab, write only where a
comment says `YOUR CODE`, and keep the `return ...;` line at the end of each method, which hands
the result back to the tests. The names in the parentheses are variables the tests fill in.

A carton holds 12 eggs.

1. `FullCartons(int eggs)` is the number of cartons the eggs fill completely.
2. `LooseEggs(int eggs)` is the number of eggs left over when every full carton is packed.
3. `AverageGrams(int totalGrams, int eggs)` is the average weight of one egg, as a `double`
   with its fractional part: 125 grams for 2 eggs is `62.5`, not `62`. The tests never pass 0
   eggs.
4. `CountFromNote(string note)` reads the number of eggs a picker wrote on a note. When the
   note holds a whole number, possibly with spaces around it, return that number. Otherwise
   return `0`. The method must never stop with an exception, whatever the note says.

Example:

```csharp
EggFarm.FullCartons(100)           // 8
EggFarm.LooseEggs(100)             // 4
EggFarm.AverageGrams(125, 2)       // 62.5
EggFarm.CountFromNote(" 48 ")      // 48
EggFarm.CountFromNote("4 dozen")   // 0
```

**Tip:** check where the conversion to `double` happens in task 3. A cast written around the
whole division comes too late, as the lesson's common mistakes show.
