The starter declares the four methods of the class `Setlist` that the tests call. Keep each
signature as it is and replace each `throw new NotImplementedException();` with your code.

1. `TotalSeconds(int[] seconds)` is the length of the whole set: the sum of the array. An empty
   array totals `0`.
2. `Longest(string[] titles, int[] seconds)` returns the title of the longest song. The two
   arrays belong together: `seconds[i]` is the length of `titles[i]`. When several songs share
   the greatest length, return the earliest of them. There is always at least one song.
3. `DropCovers(List<string> songs)` removes from the list itself every title that ends with
   `" (cover)"`, a space followed by `(cover)`. The other songs keep their order. It returns
   nothing: the caller sees the change in the list it passed.
4. `WithOpener(List<string> songs, string opener)` returns a **new** list that starts with
   `opener` and continues with the songs in their order. When `opener` is already in the list,
   it is moved to the front instead of being played twice. The list it receives must not
   change.

Example:

```csharp
int[] seconds = [214, 187, 251, 199];
string[] titles = ["Harbour Lights", "Blue Bicycle (cover)", "Last Bus Home", "Rain on Tin (cover)"];
Setlist.TotalSeconds(seconds)        // 851
Setlist.Longest(titles, seconds)     // "Last Bus Home"

List<string> songs = ["Harbour Lights", "Blue Bicycle (cover)", "Rain on Tin (cover)", "Kettle Song"];
Setlist.DropCovers(songs);
// songs is now ["Harbour Lights", "Kettle Song"]

List<string> tonight = Setlist.WithOpener(songs, "Kettle Song");
// tonight is ["Kettle Song", "Harbour Lights"], and songs is still ["Harbour Lights", "Kettle Song"]
```

**Tip:** removing from a list inside `foreach` throws, and removing while walking the indexes
forward skips the element after each removal. The lesson shows the way that works.
