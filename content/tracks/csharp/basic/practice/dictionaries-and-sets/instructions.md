The starter declares the four methods of the class `SportsDay` that the tests call. Keep each
signature as it is and replace each `throw new NotImplementedException();` with your code.

1. `Wins(string[] winners)` receives the winning house of every race, in order, and returns a
   dictionary from each house to the number of races it won. A house that won nothing does not
   appear. House names are compared exactly, as they are written.
2. `Points(Dictionary<string, int> wins, string house)` is 3 points for every race the house
   won. A house that is not in the dictionary has 0 points: the method must not throw for it.
3. `Athletes(string[] signUps)` counts the different children on the sign-up sheet. Names that
   differ only in upper and lower case, such as `Ama` and `AMA`, are the same child.
4. `InBoth(string[] sprint, string[] relay)` returns the names that appear in both arrays, each
   name once, sorted alphabetically. Here names are compared exactly.

Example:

```csharp
Dictionary<string, int> wins = SportsDay.Wins(["Red", "Blue", "Red", "Green", "Red"]);
// wins holds Red: 3, Blue: 1, Green: 1
SportsDay.Points(wins, "Red")                             // 9
SportsDay.Points(wins, "Yellow")                          // 0
SportsDay.Athletes(["Ama", "ben", "AMA", "Cy"])           // 3
SportsDay.InBoth(["Cy", "Ama", "Dev", "Ama"], ["Dev", "Eli", "Ama"])   // ["Ama", "Dev"]
```

**Tip:** reading `wins[house]` for a house that is not there throws `KeyNotFoundException`, and
`Add` throws for a key that is already there. The lesson shows the methods that do neither.
