Check.True(Laundromat.Price(0) == 0m, "no washers cost nothing");
Check.True(Laundromat.Price(1) == 4.50m, "one washer without drying costs the washing price");
Check.True(Laundromat.Price(1, true) == 6.50m, "one washer with drying costs the washing price plus the drying price");
Check.True(Laundromat.Price(2, dry: false) == 9.00m, "drying passed as false by name adds nothing");
Check.True(Laundromat.Price(dry: true, washers: 4) == 26.00m, "named arguments in any order, and drying is charged for every washer");
Check.True(Laundromat.Price(10) == 45.00m, "the washing price is charged for every washer");
