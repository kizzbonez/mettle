Check.True(EggFarm.AverageGrams(60, 1) == 60.0, "the average weight of a single egg is its own weight");
Check.True(EggFarm.AverageGrams(180, 3) == 60.0, "an average that comes out as a whole number");
Check.True(EggFarm.AverageGrams(7, 2) == 3.5, "the average keeps its fractional part instead of rounding toward zero");
Check.True(EggFarm.AverageGrams(200, 3) == 200.0 / 3, "an average that does not divide evenly keeps all of its decimals");
Check.True(EggFarm.AverageGrams(695, 12) == 695.0 / 12, "the average weight of a full carton of eggs");
