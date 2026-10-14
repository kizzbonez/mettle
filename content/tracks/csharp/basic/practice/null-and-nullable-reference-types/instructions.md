The starter declares the four methods of the class `HostelDesk` that the tests call. Keep each
signature as it is, including every `?`, and replace each `throw new NotImplementedException();`
with your code. A `?` in a signature means the value may be `null`, so your code has to check it
before using it. Nullable reference types are on: when **Run** shows a warning such as CS8602 or
CS8603, fix the code behind it instead of silencing it with `!`.

1. `CallName(string first, string? nickname)` is the name the staff use: the nickname when there
   is one (when it is not `null`), otherwise the first name.
2. `BedOf(Dictionary<string, string> beds, string guest)` returns the guest's bed from the
   dictionary, or `null` when the guest has no bed yet. It must not throw for a guest who is not
   in the dictionary.
3. `BedLabel(string? bed)` returns `Bed ` followed by the bed without the spaces around it and in
   upper case, or `No bed yet` when `bed` is `null`.
4. `AverageRating(int?[] ratings)` returns the average of the ratings that have a value, as a
   `double`. A missing rating is `null` and is left out, both from the sum and from the count.
   When no rating has a value, including when the array is empty, it returns `null`.

Example:

```csharp
HostelDesk.CallName("Margaret", "Peggy")     // "Peggy"
HostelDesk.CallName("Tomas", null)           // "Tomas"

Dictionary<string, string> beds = new() { ["Peggy"] = "3a" };
HostelDesk.BedOf(beds, "Peggy")              // "3a"
HostelDesk.BedOf(beds, "Tomas")              // null
HostelDesk.BedLabel("3a")                    // "Bed 3A"
HostelDesk.BedLabel(null)                    // "No bed yet"

HostelDesk.AverageRating([4, null, 5])       // 4.5
HostelDesk.AverageRating([null, null])       // null
```

**Tip:** `??` gives a value when something is `null`, and `TryGetValue` reads a dictionary
without throwing. A rating of `0` is a real rating, not a missing one.
