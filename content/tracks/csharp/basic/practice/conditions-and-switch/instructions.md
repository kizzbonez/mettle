The tests call the four methods of the class `SkiHill`. Write only where a comment says
`YOUR CODE`, and keep the `return ...;` line at the end of each method. Each method declares its
result variable before your code, so you can assign it inside the blocks of an `if` or a
`switch` and still return it afterwards.

1. `PassPrice(int age)` is the price of a day pass, chosen with `if`, `else if` and `else`:

   | Age | Price |
   | --- | --- |
   | under 6 | 0 |
   | 6 to 15 | 25 |
   | 16 to 64 | 48 |
   | 65 and over | 30 |

2. `MayRide(int heightCm, bool withAdult)` is `true` when the skier is at least 125 cm tall, or
   at least 100 cm tall and riding with an adult. Use `&&` and `||` in one condition.
3. `RunLevel(string colour)` turns the colour of a run into its level with a `switch` statement
   or a `switch` expression: `green` is `beginner`, `blue` is `easy`, `red` is `advanced` and
   `black` is `expert`. The colours are written in lower case, and any other text, including
   `Red` with a capital letter, is `unknown`.
4. `OpenRunsSign(int open)` returns the number, a space, then `run open` when exactly one run is
   open and `runs open` otherwise. Use the conditional operator `?:`.

Example:

```csharp
SkiHill.PassPrice(10)          // 25
SkiHill.PassPrice(70)          // 30
SkiHill.MayRide(110, true)     // true
SkiHill.MayRide(110, false)    // false
SkiHill.RunLevel("red")        // "advanced"
SkiHill.OpenRunsSign(1)        // "1 run open"
SkiHill.OpenRunsSign(4)        // "4 runs open"
```

**Tip:** test the edges of every range in the table. A 6-year-old and a 65-year-old are where
`<` and `<=` make the difference.
