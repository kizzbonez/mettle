The tests call the four methods of the class `PostOffice`. Write only where a comment says
`YOUR CODE`, and keep the `return ...;` line at the end of each method. Remember that strings
never change: a method such as `Trim` gives you a new string, which you have to keep.

1. `TidyCode(string code)` returns the tracking code without the spaces around it and in upper
   case.
2. `FileAs(string fullName)` receives a first name and a surname separated by one space, such as
   `Ada Okafor`. It returns the surname in upper case, a comma and a space, then the first name
   as it was written.
3. `ShelfLine(string city, int parcels, decimal kilos)` returns one line made of, from left to
   right:
   - a bar `|`, then the city aligned to the left in a field 10 characters wide;
   - a bar, then `parcels` aligned to the right in a field 4 characters wide;
   - a bar, then `kilos` with exactly two decimals, aligned to the right in a field 8 characters
     wide;
   - a final bar.

   A city longer than its field is written in full. The lab runs with the invariant culture, so
   the decimals follow a dot.
4. `SameCity(string a, string b)` is `true` when the two city names are equal once the spaces
   around them are removed, ignoring upper and lower case.

Example:

```csharp
PostOffice.TidyCode("  pk-0042-de ")      // "PK-0042-DE"
PostOffice.FileAs("Ada Okafor")           // "OKAFOR, Ada"
PostOffice.ShelfLine("Lagos", 3, 12.5m)   // "|Lagos     |   3|   12.50|"
PostOffice.SameCity(" lagos", "LAGOS")    // true
PostOffice.SameCity("Lagos", "Accra")     // false
```

**Tip:** for task 2, `IndexOf` finds the space, and `Substring` cuts out what comes before and
after it.
