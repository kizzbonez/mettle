Check.True(SportsDay.Athletes([]) == 0, "an empty sign-up sheet has no children");
Check.True(SportsDay.Athletes(["Ama", "Ben", "Cy"]) == 3, "three different names are three children");
Check.True(SportsDay.Athletes(["Ama", "Ama", "Ama"]) == 1, "a name signed up three times is one child");
Check.True(SportsDay.Athletes(["ama", "AMA", "Ama", "aMa"]) == 1, "names that differ only in upper and lower case are one child");

Check.True(SportsDay.InBoth(["Ama", "Ben"], ["Cy", "Dev"]).Count == 0, "no name in both races gives an empty list");
Check.True(string.Join(",", SportsDay.InBoth(["Zoe", "Max", "Ali"], ["Ali", "Zoe", "Max"])) == "Ali,Max,Zoe",
    "the names in both races are sorted alphabetically");
Check.True(string.Join(",", SportsDay.InBoth(["Ben", "Ben", "Cy"], ["Ben", "Ben"])) == "Ben",
    "a name that appears twice in each race is listed once");
Check.True(string.Join(",", SportsDay.InBoth(["Ama"], ["AMA"])) == "",
    "in the two races, names are compared exactly");
Check.True(SportsDay.InBoth([], ["Ama"]).Count == 0, "an empty race has nobody in common with another");
