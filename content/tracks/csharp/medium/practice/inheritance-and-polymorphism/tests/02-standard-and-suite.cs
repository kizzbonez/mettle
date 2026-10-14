// A standard room, seen through a Room variable.
Room standard = new Standard(12, 4);
Check.Equal(standard.NightlyRate, 90m, "the nightly rate of a standard room through a Room variable");
Check.Equal(standard.Name, "standard room", "the name of a standard room through a Room variable");
Check.Equal(standard.Total(), 360m, "the total for 4 nights in a standard room");
Check.Equal(standard.BillLine(), "Room 12, standard room, 4 nights: 360.00", "the bill line of a standard room");
Check.Equal(new Standard(1, 1).Total(), 90m, "the total for one night in a standard room");

// Suites, with and without breakfast.
var withBreakfast = new Suite(40, 2, breakfast: true);
var without = new Suite(41, 2, breakfast: false);
Check.True(withBreakfast.Breakfast, "the constructor stores breakfast when it is true");
Check.True(!without.Breakfast, "the constructor stores breakfast when it is false");
Check.Equal(without.Total(), 420m, "the total for 2 nights in a suite without breakfast");
Check.Equal(withBreakfast.Total(), 456m, "the total for 2 nights in a suite with breakfast, which is charged every night");
Check.Equal(new Suite(42, 1, breakfast: true).Total(), 228m, "the total for one night in a suite with breakfast");
Check.Equal(new Suite(43, 5, breakfast: true).Total(), 1140m, "the total for 5 nights in a suite with breakfast");

Room suite = withBreakfast;
Check.Equal(suite.NightlyRate, 210m, "the nightly rate of a suite through a Room variable, breakfast not included");
Check.Equal(suite.Name, "suite", "the name of a suite through a Room variable");
Check.Equal(suite.Total(), 456m, "the total of a suite through a Room variable includes breakfast");
Check.Equal(suite.BillLine(), "Room 40, suite, 2 nights: 456.00", "the bill line of a suite with breakfast");
Check.Equal(((Room)without).BillLine(), "Room 41, suite, 2 nights: 420.00", "the bill line of a suite without breakfast");
