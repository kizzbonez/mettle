Write `solution.cs`. The starter declares every type and signature; replace each
`throw new NotImplementedException();` with your code. Keep every type in the global namespace
(no `namespace` line) and do not change `MemberKind`, `ItemKind` or `Loan`.

```csharp
public enum MemberKind { Adult, Child, Senior, Staff }
public enum ItemKind { Book, Dvd, Magazine }

// Returned is null while the item is still out.
public readonly record struct Loan(
    string MemberId, MemberKind Member, ItemKind Item, DateOnly Due, DateOnly? Returned = null);
```

1. **`Fines.For(Loan loan, DateOnly today)`** returns the fine for one loan as a `decimal`.
   - A returned loan is charged up to its `Returned` date; a loan still out is charged up to
     `today`.
   - Days late is that date minus `Due`, in whole days. If it is zero or less, the fine is `0`.
   - The daily rate is `0.20` for a `Book`, `1.00` for a `Dvd` and `0.10` for a `Magazine`.
   - A `Child` or a `Senior` pays half the daily rate. `Staff` never pay. An `Adult` pays the full
     rate.
   - A single loan's fine, after any discount, never exceeds `10.00`.
2. **`Waitlist<T>`**, where `T : notnull`, keeps members in the order they joined. Two members
   are the same if `T`'s own equality says so.
   - `int Count` is the number of members waiting.
   - `bool Join(T member)` adds the member at the back and returns `true`. If the member is
     already waiting, it changes nothing and returns `false`.
   - `bool Leave(T member)` removes the member and returns `true`, or returns `false` if the member
     was not waiting.
   - `T Next()` removes and returns the member at the front. On an empty waitlist it throws
     `InvalidOperationException`.
   - `int PositionOf(T member)` is the member's place in the line, starting at `1` for the front,
     or `0` if the member is not waiting.
   - `int RemoveAll(Predicate<T> match)` removes every waiting member for which `match` returns
     `true`, keeps the others in order, and returns how many it removed.
   - `Waitlist<T>` implements `IEnumerable<T>`, listing the members from front to back.
3. **`LoanReports`** holds three extension members on `IEnumerable<Loan>`. The starter writes them
   in a C# 14 extension block; you may use classic extension methods for the two methods instead,
   as long as the calls below still work. Each of them reads `loans` **at most once**: the input
   may be a stream that cannot be read twice.
   - `loans.Overdue(today)` returns the loans that are still out and whose `Due` is before
     `today`, earliest `Due` first; loans due on the same day are ordered by `MemberId` (ordinal).
     A loan due today is not overdue.
   - `loans.FinesByMember(today)` returns an `IReadOnlyList<(string MemberId, decimal Total)>`:
     one entry per member, the total of `Fines.For` over that member's loans. Members whose total
     is `0` are left out. The largest total comes first; equal totals are ordered by `MemberId`
     (ordinal).
   - `loans.OpenByKind` is a property returning an `IReadOnlyDictionary<ItemKind, int>`: the
     number of loans still out for **every** `ItemKind`, including kinds with none out.

Example:

```csharp
var today = new DateOnly(2026, 3, 10);
Loan[] loans =
[
    new Loan("M01", MemberKind.Adult, ItemKind.Book, new DateOnly(2026, 3, 1), new DateOnly(2026, 3, 6)),
    new Loan("M02", MemberKind.Child, ItemKind.Dvd, new DateOnly(2026, 3, 7)),
    new Loan("M01", MemberKind.Adult, ItemKind.Dvd, new DateOnly(2026, 2, 1), new DateOnly(2026, 3, 3)),
    new Loan("M03", MemberKind.Staff, ItemKind.Dvd, new DateOnly(2026, 3, 2)),
    new Loan("M04", MemberKind.Senior, ItemKind.Magazine, new DateOnly(2026, 3, 9)),
    new Loan("M02", MemberKind.Child, ItemKind.Book, new DateOnly(2026, 3, 20)),
];

Fines.For(loans[0], today);   // 1.00   5 days x 0.20
Fines.For(loans[1], today);   // 1.50   3 days x 0.50, still out
Fines.For(loans[2], today);   // 10.00  30 days x 1.00, capped

loans.Overdue(today);         // M03 (due 2 March), M02 (7 March), M04 (9 March)
loans.FinesByMember(today);   // [("M01", 11.00), ("M02", 1.50), ("M04", 0.05)]
loans.OpenByKind;             // Book 1, Dvd 2, Magazine 1

var holds = new Waitlist<string>();
holds.Join("M01");            // true
holds.Join("M02");            // true
holds.Join("M01");            // false: already waiting
holds.PositionOf("M02");      // 2
holds.Next();                 // "M01"
string.Join(",", holds);      // "M02"
```

**Tips.** `DateOnly.DayNumber` turns a date into a whole number of days. A switch expression
keeps the rate rules readable. `Enum.GetValues<ItemKind>()` lists every kind. If you count with
LINQ, remember that every `Count(...)` over `loans` is another read.
