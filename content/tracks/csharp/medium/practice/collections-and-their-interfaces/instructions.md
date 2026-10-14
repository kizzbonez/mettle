Every signature is in the starter. Choose the collections the `Kitchen` keeps in its private
fields, then write the bodies marked with `throw new NotImplementedException();`.

1. **Orders wait in arrival order.**
   - `Order(string dish)` adds an order at the back.
   - `int Waiting` is the number of orders not yet cooked.
   - `string? NextUp` is the order that has waited longest, without removing it, or `null` when
     nothing is waiting.
   - `string? Cook()` removes that order, records it as served and returns it. When nothing is
     waiting it returns `null` and changes nothing.
2. **`IReadOnlyList<string> Served`** lists the dishes cooked so far, in the order they were
   cooked. Callers must not be able to change it: return a read-only wrapper, not your own list,
   so that casting it back to `List<string>` fails. The wrapper stays current, so dishes cooked
   after a caller took it appear in it.
3. **`Menu.Tally(IEnumerable<string> dishes)`** counts each dish and returns an
   `IReadOnlyDictionary<string, int>`. It accepts any sequence: an array, a list, a set, a queue.
   - Dishes that differ only in case are the same dish. The key keeps the spelling met first.
   - The keys come out in alphabetical order, ignoring case.
   - Looking a dish up works in any case too.

   One sorted collection with a comparer does all three.

Example:

```csharp
var kitchen = new Kitchen();
kitchen.Order("soup");
kitchen.Order("risotto");
kitchen.Order("soup");
kitchen.Waiting                       // 3
kitchen.NextUp                        // "soup", still waiting
kitchen.Cook()                        // "soup"
IReadOnlyList<string> served = kitchen.Served;
kitchen.Cook()                        // "risotto"
served.Count                          // 2: the view stays current
served[1]                             // "risotto"
kitchen.Waiting                       // 1

var tally = Menu.Tally(["Soup", "risotto", "soup", "Bread"]);
string.Join(",", tally.Keys)          // "Bread,risotto,Soup"
tally["SOUP"]                         // 2
```
