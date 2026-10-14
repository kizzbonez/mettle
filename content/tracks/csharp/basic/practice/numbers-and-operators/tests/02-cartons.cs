Check.True(EggFarm.FullCartons(0) == 0 && EggFarm.LooseEggs(0) == 0, "no eggs fill no cartons and leave none over");
Check.True(EggFarm.FullCartons(11) == 0, "11 eggs are not enough for one full carton");
Check.True(EggFarm.LooseEggs(11) == 11, "when no carton is full, every egg is left over");
Check.True(EggFarm.FullCartons(12) == 1 && EggFarm.LooseEggs(12) == 0, "exactly one carton's worth fills one carton and leaves none over");
Check.True(EggFarm.FullCartons(13) == 1 && EggFarm.LooseEggs(13) == 1, "one egg more than a carton leaves that egg over");
Check.True(EggFarm.FullCartons(144) == 12 && EggFarm.LooseEggs(144) == 0, "a gross of 144 eggs fills twelve cartons exactly");
Check.True(EggFarm.FullCartons(1000) == 83 && EggFarm.LooseEggs(1000) == 4, "the cartons and the leftover eggs for a large day");
