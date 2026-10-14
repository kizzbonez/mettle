List<string> twoInARow = ["One", "Two (cover)", "Three (cover)", "Four"];
Setlist.DropCovers(twoInARow);
Check.True(string.Join("|", twoInARow) == "One|Four", "two covers in a row are both removed");

List<string> allCovers = ["A (cover)", "B (cover)", "C (cover)"];
Setlist.DropCovers(allCovers);
Check.True(allCovers.Count == 0, "a set of nothing but covers ends up empty");

List<string> noCovers = ["Kettle Song", "Harbour Lights"];
Setlist.DropCovers(noCovers);
Check.True(string.Join("|", noCovers) == "Kettle Song|Harbour Lights", "a set without covers stays as it was, in its order");

List<string> ends = ["(cover) Story", "First (cover)", "Recover", "Under Cover", "Last (cover)"];
Setlist.DropCovers(ends);
Check.True(string.Join("|", ends) == "(cover) Story|Recover|Under Cover",
    "only titles that end with a space and (cover) are removed, and the first and the last can be among them");

List<string> empty = [];
Setlist.DropCovers(empty);
Check.True(empty.Count == 0, "an empty set stays empty");
