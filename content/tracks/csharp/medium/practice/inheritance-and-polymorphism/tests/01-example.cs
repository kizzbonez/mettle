// The example from the instructions.
var standard = new Standard(101, 2);
var suite = new Suite(301, 3, breakfast: true);
var family = new FamilyRoom(205, 2, children: 2);

Check.Equal(standard.NightlyRate, 90m, "the nightly rate of a standard room");
Check.Equal(suite.Total(), 684m, "the total for 3 nights in a suite with breakfast");
Check.Equal(family.NightlyRate, 120m, "the nightly rate of a family room with 2 children");

Room room = family;
Check.Equal(room.BillLine(), "Room 205, family room, 2 nights: 240.00", "the bill line of a family room seen through a Room variable");

Check.Equal(FrontDesk.Bill([standard, suite, family]), 1104m, "the bill for the three rooms");
