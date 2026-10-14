Check.True(Laundromat.WashersNeeded(0) == 0, "no laundry needs no washer");
Check.True(Laundromat.WashersNeeded(1) == 1, "a single kilogram still needs a whole washer");
Check.True(Laundromat.WashersNeeded(8) == 1, "exactly one washer's worth needs one washer");
Check.True(Laundromat.WashersNeeded(9) == 2, "one kilogram over a washer's capacity needs a second washer");
Check.True(Laundromat.WashersNeeded(16) == 2, "exactly two washers' worth needs two washers");
Check.True(Laundromat.WashersNeeded(100) == 13, "the default capacity of 8 kg is used when no capacity is given");
Check.True(Laundromat.WashersNeeded(5, 5) == 1, "a capacity passed by position is used");
Check.True(Laundromat.WashersNeeded(11, capacity: 5) == 3, "a capacity passed by name is used, and a part-full washer counts");
Check.True(Laundromat.WashersNeeded(7, 1) == 7, "with a capacity of 1 kg, every kilogram needs its own washer");
