var none = new FamilyRoom(7, 3, children: 0);
var one = new FamilyRoom(8, 3, children: 1);
var four = new FamilyRoom(9, 3, children: 4);

Check.Equal(none.Children, 0, "the constructor stores 0 children");
Check.Equal(four.Children, 4, "the constructor stores 4 children");

Check.Equal(none.NightlyRate, 90m, "a family room with no children costs the standard rate");
Check.Equal(one.NightlyRate, 105m, "the nightly rate of a family room with one child");
Check.Equal(four.NightlyRate, 150m, "the nightly rate of a family room with four children");
Check.Equal(four.Total(), 450m, "the total for 3 nights in a family room with four children");

// The overrides run whatever the variable's type.
Room asRoom = one;
Standard asStandard = one;
Check.Equal(asRoom.NightlyRate, 105m, "the nightly rate of a family room through a Room variable");
Check.Equal(asStandard.NightlyRate, 105m, "the nightly rate of a family room through a Standard variable");
Check.Equal(asRoom.Name, "family room", "the name of a family room through a Room variable");
Check.Equal(asStandard.Name, "family room", "the name of a family room through a Standard variable");
Check.Equal(asRoom.Total(), 315m, "the total of a family room through a Room variable");
Check.Equal(asRoom.BillLine(), "Room 8, family room, 3 nights: 315.00", "the bill line of a family room with one child");

Check.True(typeof(FamilyRoom).IsSealed, "FamilyRoom stays sealed");
