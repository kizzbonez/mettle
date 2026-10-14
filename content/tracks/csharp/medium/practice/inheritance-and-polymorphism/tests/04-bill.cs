Check.Equal(FrontDesk.Bill(new List<Room>()), 0m, "the bill for no rooms");
Check.Equal(FrontDesk.Bill([new Standard(1, 3)]), 270m, "the bill for one standard room");
Check.Equal(FrontDesk.Bill([new Suite(2, 2, breakfast: true)]), 456m, "the bill for one suite counts its breakfast");
Check.Equal(FrontDesk.Bill([new FamilyRoom(3, 1, children: 3)]), 135m, "the bill for one family room counts its children");

List<Room> wedding =
[
    new Suite(301, 2, breakfast: true),
    new Suite(302, 2, breakfast: false),
    new Standard(101, 2),
    new Standard(102, 1),
    new FamilyRoom(201, 2, children: 1),
];
Check.Equal(FrontDesk.Bill(wedding), 1356m, "the bill for five rooms of three kinds");

wedding.Reverse();
Check.Equal(FrontDesk.Bill(wedding), 1356m, "the bill does not depend on the order of the rooms");
Check.Equal(wedding.Count, 5, "the bill leaves the list of rooms as it was");
