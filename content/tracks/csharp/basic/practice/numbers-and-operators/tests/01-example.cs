// The example from the instructions: 100 eggs, an average weight, and two
// notes. Each method hands its result back, and the test compares it.
Check.Equal(EggFarm.FullCartons(100), 8, "the full cartons that 100 eggs fill");
Check.Equal(EggFarm.LooseEggs(100), 4, "the eggs left over from 100");
Check.Equal(EggFarm.AverageGrams(125, 2), 62.5, "the average weight of 2 eggs that weigh 125 grams together");
Check.Equal(EggFarm.CountFromNote(" 48 "), 48, "the count read from the note \" 48 \"");
Check.Equal(EggFarm.CountFromNote("4 dozen"), 0, "the count read from the note \"4 dozen\"");
