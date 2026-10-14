Write `solution.cs`. The starter declares every type and member the tests use. Keep their names,
parameters and return types. You may add private fields and private methods. Do not add
top-level statements or a `Main` method.

**Ids.** A tool id or member id is compared after removing the spaces around it and converting
it to upper case, so `" drill-04"` and `"DRILL-04"` are the same tool. Every method that takes an
id stores and returns ids in this normalized form.

1. `public static string NormalizeId(string id)` returns `id.Trim().ToUpperInvariant()`. If `id`
   is empty or contains only whitespace, it throws `ArgumentException`. Every method below that
   takes an id calls it, so a blank id makes any of them throw `ArgumentException`.
2. `public ToolLibrary(int loanDays, decimal lateFeePerDay)` throws
   `ArgumentOutOfRangeException` when `loanDays` is less than 1 or `lateFeePerDay` is negative.
   Otherwise it sets the properties `LoanDays` and `LateFeePerDay`. A fee of `0` is allowed.
3. `public void Lend(string toolId, string memberId, int day)` lends a tool. Check in this order
   and throw at the first problem:
   - a blank tool id or member id: `ArgumentException`;
   - `day` below 0: `ArgumentOutOfRangeException`;
   - the tool is already on loan, to anyone: `InvalidOperationException`;
   - the member already holds `MaxToolsPerMember` (3) tools: `InvalidOperationException`.

   Otherwise record the loan. A method that throws must not change anything.
4. `public decimal Return(string toolId, int day)` takes a tool back and returns the late fee
   charged for it. Check in this order:
   - a blank tool id: `ArgumentException`;
   - the tool is not on loan: `InvalidOperationException`;
   - `day` is earlier than the day the tool was lent: `ArgumentOutOfRangeException`.

   The tool was kept for `day - dayLent` days. Each day beyond `LoanDays` costs
   `LateFeePerDay`, so a tool returned after exactly `LoanDays` days costs nothing. Remove the
   loan, add the fee to what the member owes, and return the fee (`0` when it was on time).
5. `public string? HolderOf(string toolId)` returns the normalized id of the member who has the
   tool, or `null` when it is not on loan.
6. `public List<string> ToolsHeldBy(string memberId)` returns the normalized ids of the member's
   tools, sorted with `StringComparer.Ordinal`, or an empty list.
7. `public decimal FeesOwedBy(string memberId)` returns the total of every fee charged to the
   member so far, or `0`.
8. `public string Describe(string memberId)` returns one line in exactly this form, using the
   singular `tool` only for exactly one tool and the fees with two decimals and a dot
   (`ToString("F2", CultureInfo.InvariantCulture)`):

   ```text
   M1032: 1 tool out, owes 0.50
   M2001: 0 tools out, owes 1.50
   ```
9. `public static List<int> DeskLog.Replay(ToolLibrary library, string text)` applies a whole
   log to `library` and returns the numbers of the lines it could not apply, in increasing
   order.
   - Lines end with `\n` or `\r\n`. They are numbered from 1, and every line counts, including
     the ones that are skipped.
   - Skip a line that is empty or only whitespace, and a line whose first non-whitespace
     character is `#`.
   - Fields are separated by one or more spaces, and spaces at either end of a line are
     ignored. A line is `DAY OUT TOOL MEMBER` (four fields) or `DAY IN TOOL` (three fields).
   - Reject the line when `DAY` is not a whole number of 0 or more, when the action is not
     exactly `OUT` or `IN` (in capitals), or when the number of fields does not match the
     action.
   - Otherwise call `Lend` or `Return`. If that throws `ArgumentException` (which includes
     `ArgumentOutOfRangeException`) or `InvalidOperationException`, reject the line.
   - Carry on with the next line after a rejected one. `Replay` never throws, whatever the text.

Example, the start of a Saturday shift with a loan period of 7 days and a fee of 0.50 a day:

```csharp
var library = new ToolLibrary(7, 0.50m);
string log =
    "# Saturday desk, volunteer: Priya\n" +   // line 1: skipped
    "1 OUT drill-04 m1032\n" +                // line 2
    "1 OUT SAW-11 M1032\n" +                  // line 3
    "2 OUT LADDER-2 M2001\n" +                // line 4
    "3 OUT DRILL-04 M2001\n" +                // line 5: rejected, DRILL-04 is already out
    "\n" +                                    // line 6: skipped
    "9 IN DRILL-04\n" +                       // line 7: kept 8 days, 1 day late, fee 0.50
    "10 BORROW SAW-11 M1032\n" +              // line 8: rejected, unknown action
    "12 IN ladder-2\n";                       // line 9: kept 10 days, 3 days late, fee 1.50

List<int> rejected = DeskLog.Replay(library, log);   // [5, 8]
library.HolderOf("saw-11");                          // "M1032"
library.HolderOf("DRILL-04");                        // null
library.Describe("M1032");                           // "M1032: 1 tool out, owes 0.50"
library.Describe("m2001");                           // "M2001: 0 tools out, owes 1.50"
```

**Tips.** Write `NormalizeId` first and use it everywhere. Decide whether to skip a line before
you split it: a comment may contain anything. Test your `Return` with a tool that comes back
exactly on time.
