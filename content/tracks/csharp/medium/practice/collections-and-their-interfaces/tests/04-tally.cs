// Any sequence will do.
Check.Equal(Menu.Tally(new string[0]).Count, 0, "the tally of no dishes");
var fromList = Menu.Tally(new List<string> { "pie", "pie", "jam" });
Check.Equal(fromList["pie"], 2, "a tally of a list");
var fromSet = Menu.Tally(new HashSet<string> { "pie", "jam" });
Check.Equal(fromSet.Count, 2, "a tally of a set");
var line = new Queue<string>();
line.Enqueue("tea");
line.Enqueue("tea");
Check.Equal(Menu.Tally(line)["tea"], 2, "a tally of a queue");

// Order of the keys: alphabetical, ignoring case.
var evening = Menu.Tally(["stew", "Apple pie", "curry", "bread", "Curry", "apple pie", "STEW", "stew"]);
Check.Equal(evening.Count, 4, "dishes that differ only in case are counted as one");
Check.SequenceEqual(evening.Keys, new[] { "Apple pie", "bread", "curry", "stew" }, "the keys in alphabetical order, ignoring case, each spelled as first met");
Check.SequenceEqual(evening.Values, new[] { 2, 1, 2, 3 }, "the counts, in the order of the keys");

// Lookups in any case.
Check.Equal(evening["Stew"], 3, "a lookup in another case");
Check.Equal(evening["APPLE PIE"], 2, "a lookup in capitals");
Check.True(evening.ContainsKey("BREAD"), "ContainsKey in another case");
Check.True(!evening.TryGetValue("soup", out _), "TryGetValue for a dish nobody ordered");

// The first spelling is kept.
var spelled = Menu.Tally(["tiramisu", "Tiramisu", "TIRAMISU"]);
Check.SequenceEqual(spelled.Keys, new[] { "tiramisu" }, "the key keeps the spelling met first");

// Upper and lower case sort together.
var mixed = Menu.Tally(["b", "A", "a", "C", "c", "B"]);
Check.SequenceEqual(mixed.Keys, new[] { "A", "b", "C" }, "letters in both cases sort as one alphabet");
