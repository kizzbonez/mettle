Check.True(Campsite.StayCost(0) == 0m, "the cost of a stay of 0 nights");
Check.True(Campsite.StayCost(1) == 18.50m, "the cost of a single night, which is the price per night itself");
Check.True(Campsite.StayCost(4) == 74m, "the cost of 4 nights, the price per night times the nights");
Check.True(Campsite.StayCost(14) == 259m, "the cost of a two-week stay of 14 nights");
