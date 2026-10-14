Check.True(SkiHill.MayRide(125, false), "a skier of exactly 125 cm may ride alone");
Check.True(SkiHill.MayRide(180, false), "a tall skier may ride alone");
Check.True(SkiHill.MayRide(180, true), "a tall skier may also ride with an adult");
Check.True(!SkiHill.MayRide(124, false), "a skier of 124 cm may not ride alone");
Check.True(SkiHill.MayRide(124, true), "a skier of 124 cm may ride with an adult");
Check.True(SkiHill.MayRide(100, true), "a skier of exactly 100 cm may ride with an adult");
Check.True(!SkiHill.MayRide(99, true), "a skier under 100 cm may not ride, even with an adult");
Check.True(!SkiHill.MayRide(99, false), "a skier under 100 cm may not ride alone");
