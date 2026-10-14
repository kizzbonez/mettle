The interface `ITimed` has two members every finisher supplies, `Name` and `Seconds`. The
constructors of `Runner` and `Relay` are complete. Write the bodies marked with
`throw new NotImplementedException();`.

1. **`ITimed.Result()`** is a default interface method: the line on the results board. It is the
   name, a space, then the time as minutes, a colon and the seconds in two digits. Minutes are not
   split into hours, so 3725 seconds is `62:05`.
2. **`Relay`** is a `readonly struct` that implements `ITimed`. Its legs are run one after another,
   so its `Seconds` is the sum of the legs. A relay with no legs has `0` seconds.
3. **`Runner`** implements `IComparable<Runner>` and `IEquatable<Runner>`, so that `Sort` and
   `Contains` work on a `List<Runner>`.
   - `CompareTo(Runner? other)`: the faster runner sorts first. On equal times, sort by name with
     `string.CompareOrdinal`. Every runner sorts after `null`.
   - `Equals(Runner? other)`: two runners are equal when they have the same name and the same
     time. Override `Equals(object? obj)` and `GetHashCode()` so that every route to equality
     agrees.
4. **`Results.Winner(List<ITimed> entries)`** returns the entry with the fewest seconds, runner or
   relay. On a tie, the entry that comes first in the list wins. The list is never empty.

Example:

```csharp
var ada = new Runner("Ada", 2465);
var bo = new Runner("Bo", 2401);
var club = new Relay("Harbour Club", [600, 615, 590, 640]);

ITimed entry = ada;           // the default method is reached through the interface
entry.Result()                // "Ada 41:05"
club.Seconds                  // 2445
((ITimed)club).Result()       // "Harbour Club 40:45"

var runners = new List<Runner> { ada, bo, new Runner("Cy", 2401) };
runners.Sort();               // Bo, Cy, Ada: fastest first, equal times by name
runners.Contains(new Runner("Ada", 2465))    // true

Results.Winner([ada, club, bo])              // bo
```
