// The example from the instructions. Each method hands its result back, and
// the test compares it with the value the instructions give.
Check.Equal(Campsite.StayCost(3), 55.50m, "the cost of a stay of 3 nights");
Check.Equal(Campsite.NextPitchSign(7), "Next free pitch: 8", "the sign when pitch 7 was the last one taken");
Check.Equal(Campsite.TentTag("Ada Okafor", 3, 'B', true), "Ada Okafor | nights: 3 | field: B | dog: True",
    "the tag for Ada Okafor, 3 nights on field B, with a dog");
