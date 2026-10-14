Complete the class `WeighIn`. Keep every public name, parameter and type as it is. As in the
lesson's `Order` class, the method receives the text instead of reading the console itself, so
the tests can hand it a whole sheet: here the sheet arrives as one `string`.

1. `ReadSheet(string text)` reads a weigh-in sheet and returns the problems it found.
   - Cut the text into lines with `text.Split('\n')`. Number every line from 1, including the
     ones you skip.
   - Remove the spaces around each line. Skip a line that is then empty or starts with `#`.
   - Split the line into fields at spaces, ignoring repeated spaces. A line must have exactly
     two fields, a name and a weight. Otherwise the problem is
     `line N: expected a name and a weight`.
   - The weight must be a whole number of 1 or more. Otherwise the problem is
     `line N: 'W' is not a weight`, where `W` is the second field as it was written.
   - Otherwise add the weight to the angler's total.

   Return the problems in the order of their lines. A bad line never stops the rest, and the
   method never throws. When it is called again with another sheet, the totals keep growing.
2. `TotalFor(string angler)` is the angler's total in grams, or `0` for an angler with no catch.
   Names are compared exactly, as they are written.
3. `Leader()` is the name of the angler with the greatest total. On a tie, it is the name that
   comes first in alphabetical order. When no catch has been recorded, it is `null`.

Example:

```csharp
var weighIn = new WeighIn();
string sheet =
    "# Lake Ormond, Sunday\n" +   // line 1: a note, skipped
    "Ada 2400\n" +                // line 2
    "Bo 950\n" +                  // line 3
    "\n" +                        // line 4: blank, skipped
    "Ada 1200\n" +                // line 5
    "Cy two kilos\n" +            // line 6: three fields
    "Bo -300\n";                  // line 7: not a weight

weighIn.ReadSheet(sheet)
// ["line 6: expected a name and a weight", "line 7: '-300' is not a weight"]
weighIn.TotalFor("Ada")    // 3600
weighIn.TotalFor("Cy")     // 0
weighIn.Leader()           // "Ada"
```

**Tip:** decide whether to skip a line before you split it, because a note may contain
anything. Use `TryParse`, not `Parse`, so that no line can throw.
