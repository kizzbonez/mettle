// The example from the instructions: count the wins, turn them into points,
// then count the children and find who runs in both races.
Dictionary<string, int> wins = SportsDay.Wins(["Red", "Blue", "Red", "Green", "Red"]);
Check.Equal(wins.Count, 3, "the number of houses that won at least one race");
Check.Equal(wins.GetValueOrDefault("Red"), 3, "the races won by Red");
Check.Equal(wins.GetValueOrDefault("Blue"), 1, "the races won by Blue");
Check.Equal(SportsDay.Points(wins, "Red"), 9, "Red's points");
Check.Equal(SportsDay.Points(wins, "Yellow"), 0, "the points of Yellow, which won nothing");
Check.Equal(SportsDay.Athletes(["Ama", "ben", "AMA", "Cy"]), 3, "the different children among Ama, ben, AMA and Cy");
Check.SequenceEqual(SportsDay.InBoth(["Cy", "Ama", "Dev", "Ama"], ["Dev", "Eli", "Ama"]), ["Ama", "Dev"],
    "the children who run in both races");
