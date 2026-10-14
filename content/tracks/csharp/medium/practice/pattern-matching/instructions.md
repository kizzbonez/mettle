The records `Thermometer` and `Door` are complete: do not change them. Write the three methods of
`Hub`, each as one switch expression. Arms are tried from top to bottom, so put the specific ones
first.

1. **`Comfort(double celsius)`**, with relational patterns:
   - below `16` is `cold`;
   - from `16` up to but not including `24` is `comfortable`;
   - `24` or more is `warm`;
   - anything else, which can only be `double.NaN`, is `no reading`.
2. **`Describe(object? message)`**, with type, property and positional patterns:
   - `null` is `nothing`;
   - a `Thermometer` is its room, `: `, and the comfort of its reading, such as `kitchen: warm`;
   - an open `Door` is `<name> door is open`, whatever `Locked` says;
   - a closed door is `<name> door is locked` if it is locked, otherwise `<name> door is closed`;
   - an empty string is `empty note`, and any other string is `note: ` followed by the text;
   - anything else is `unknown message`.
3. **`Command(string[] words)`**, with list patterns:
   - no words is `say something`;
   - `lights` followed by exactly `on` or `off` is `lights on` or `lights off`;
   - `heat` followed by exactly one whole number from `5` to `30` is `heating to <number>`;
   - `play` followed by one name is `playing <name>`, and by more than one is
     `playing <first> and <n> more`;
   - any other command is `unknown command: ` followed by its first word.

Example:

```csharp
Hub.Comfort(21.5)                                   // "comfortable"
Hub.Comfort(double.NaN)                             // "no reading"

Hub.Describe(new Thermometer("kitchen", 25))        // "kitchen: warm"
Hub.Describe(new Door("front", Open: false, Locked: true))   // "front door is locked"
Hub.Describe("milk is low")                         // "note: milk is low"
Hub.Describe(null)                                  // "nothing"
Hub.Describe(42)                                    // "unknown message"

Hub.Command(["lights", "off"])                      // "lights off"
Hub.Command(["heat", "21"])                         // "heating to 21"
Hub.Command(["play", "jazz", "blues", "soul"])      // "playing jazz and 2 more"
Hub.Command(["heat", "hot"])                        // "unknown command: heat"
Hub.Command([])                                     // "say something"
```
