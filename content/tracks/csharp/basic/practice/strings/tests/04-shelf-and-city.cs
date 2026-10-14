Check.True(PostOffice.ShelfLine("Accra", 12, 3m) == "|Accra     |  12|    3.00|",
    "a whole number of kilos still gets two decimals, and each value fills its field");
Check.True(PostOffice.ShelfLine("Oslo", 1234, 1234.567m) == "|Oslo      |1234| 1234.57|",
    "a count that fills its field exactly, and kilos rounded to two decimals");
Check.True(PostOffice.ShelfLine("Johannesburg", 1, 0.25m) == "|Johannesburg|   1|    0.25|",
    "a city longer than its field is written in full");
Check.True(PostOffice.ShelfLine("Rome", 0, 0m).StartsWith("|Rome      |"),
    "the city is aligned to the left, so the spaces come after it");

Check.True(PostOffice.SameCity("Lagos", "Lagos"), "a city is the same as itself");
Check.True(PostOffice.SameCity("Lagos", "lAgOs"), "upper and lower case do not matter");
Check.True(PostOffice.SameCity("  Lagos ", "lagos   "), "spaces around either name do not matter");
Check.True(!PostOffice.SameCity("Lagos", "Lago"), "a name that is one letter short is a different city");
Check.True(!PostOffice.SameCity("Los Angeles", "LosAngeles"), "a space inside a name still counts");
