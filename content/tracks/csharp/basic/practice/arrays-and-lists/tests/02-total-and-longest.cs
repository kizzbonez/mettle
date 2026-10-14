Check.True(Setlist.TotalSeconds([]) == 0, "an empty set lasts 0 seconds");
Check.True(Setlist.TotalSeconds([300]) == 300, "a set of one song lasts as long as that song");
Check.True(Setlist.TotalSeconds([1, 20, 300, 4000]) == 4321, "every song is added, the first and the last included");

Check.True(Setlist.Longest(["Solo"], [95]) == "Solo", "with one song, that song is the longest");
Check.True(Setlist.Longest(["A", "B", "C"], [400, 100, 200]) == "A", "the longest song can be the first");
Check.True(Setlist.Longest(["A", "B", "C"], [100, 200, 400]) == "C", "the longest song can be the last");
Check.True(Setlist.Longest(["A", "B", "C", "D"], [100, 300, 200, 300]) == "B",
    "when two songs share the greatest length, the earlier one is returned");
Check.True(Setlist.Longest(["Long Title Here", "X"], [60, 61]) == "X",
    "the longest song is chosen by its seconds, not by the length of its title");
