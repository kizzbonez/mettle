// The example from the instructions. Each method hands its result back, and
// the test compares it with the value the instructions give.
Check.Equal(SkiHill.PassPrice(10), 25m, "the price of a pass for a 10-year-old");
Check.Equal(SkiHill.PassPrice(70), 30m, "the price of a pass for a 70-year-old");
Check.Equal(SkiHill.MayRide(110, true), true, "whether a skier of 110 cm with an adult may ride");
Check.Equal(SkiHill.MayRide(110, false), false, "whether a skier of 110 cm without an adult may ride");
Check.Equal(SkiHill.RunLevel("red"), "advanced", "the level of a red run");
Check.Equal(SkiHill.OpenRunsSign(1), "1 run open", "the sign when one run is open");
Check.Equal(SkiHill.OpenRunsSign(4), "4 runs open", "the sign when four runs are open");
