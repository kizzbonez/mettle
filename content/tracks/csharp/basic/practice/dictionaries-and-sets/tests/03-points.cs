Dictionary<string, int> wins = new() { ["Red"] = 1, ["Blue"] = 4, ["Green"] = 0 };
Check.True(SportsDay.Points(wins, "Red") == 3, "a single win is worth 3 points");
Check.True(SportsDay.Points(wins, "Blue") == 12, "every win is worth 3 points");
Check.True(SportsDay.Points(wins, "Green") == 0, "a house stored with no wins has 0 points");
Check.True(SportsDay.Points(wins, "Purple") == 0, "a house that is not in the dictionary has 0 points, without an exception");
Check.True(SportsDay.Points(new Dictionary<string, int>(), "Red") == 0, "an empty dictionary gives 0 points");
