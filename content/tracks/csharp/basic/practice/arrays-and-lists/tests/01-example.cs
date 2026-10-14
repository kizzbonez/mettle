// The example from the instructions: two arrays for the first two methods,
// then a list that DropCovers changes and WithOpener copies.
int[] seconds = [214, 187, 251, 199];
string[] titles = ["Harbour Lights", "Blue Bicycle (cover)", "Last Bus Home", "Rain on Tin (cover)"];
Check.Equal(Setlist.TotalSeconds(seconds), 851, "the length of the four songs together");
Check.Equal(Setlist.Longest(titles, seconds), "Last Bus Home", "the title of the longest of the four songs");

List<string> songs = ["Harbour Lights", "Blue Bicycle (cover)", "Rain on Tin (cover)", "Kettle Song"];
Setlist.DropCovers(songs);
Check.SequenceEqual(songs, ["Harbour Lights", "Kettle Song"], "the list after DropCovers");

List<string> tonight = Setlist.WithOpener(songs, "Kettle Song");
Check.SequenceEqual(tonight, ["Kettle Song", "Harbour Lights"], "the list that WithOpener returns");
Check.SequenceEqual(songs, ["Harbour Lights", "Kettle Song"], "the list given to WithOpener, which must not change");
