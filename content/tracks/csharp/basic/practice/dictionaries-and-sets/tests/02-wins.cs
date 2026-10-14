Check.True(SportsDay.Wins([]).Count == 0, "no races give an empty dictionary");

Dictionary<string, int> one = SportsDay.Wins(["Blue"]);
Check.True(one.Count == 1 && one.GetValueOrDefault("Blue") == 1, "a single race gives one house with one win");

Dictionary<string, int> all = SportsDay.Wins(["Green", "Green", "Green", "Green"]);
Check.True(all.Count == 1 && all.GetValueOrDefault("Green") == 4, "a house that wins every race is counted once, with every win");

Dictionary<string, int> mixed = SportsDay.Wins(["Red", "Blue", "Yellow", "Blue", "Red", "Blue"]);
Check.True(mixed.Count == 3, "every house that won appears once as a key");
Check.True(mixed.GetValueOrDefault("Red") == 2 && mixed.GetValueOrDefault("Blue") == 3 && mixed.GetValueOrDefault("Yellow") == 1,
    "each house's wins are counted, wherever they come in the order");
Check.True(!mixed.ContainsKey("Green"), "a house that won nothing does not appear");

Dictionary<string, int> exact = SportsDay.Wins(["Red", "red"]);
Check.True(exact.Count == 2, "house names are compared exactly, so a different case is a different key");
