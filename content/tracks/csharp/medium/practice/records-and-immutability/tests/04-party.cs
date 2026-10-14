var first = new Booking("Hal", new Seat('G', 1), 20m);
var second = new Booking("Ivy", new Seat('G', 2), 20m);
var third = new Booking("Jo", new Seat('G', 3), 20m);

var original = new Party("Hal", [first]);
var list = original.Bookings;

var two = original.Add(second);
Check.Equal(two.Bookings.Count, 2, "the new party has one more booking");
Check.True(two.Bookings[0] == first && two.Bookings[1] == second, "the new booking goes at the end, after the earlier ones");
Check.Equal(two.Organiser, "Hal", "the new party keeps the organiser");

Check.Equal(original.Bookings.Count, 1, "the original party keeps its one booking");
Check.True(ReferenceEquals(original.Bookings, list), "the original party keeps its own list object");
Check.Equal(list.Count, 1, "the original party's list is not changed");
Check.True(!ReferenceEquals(two.Bookings, original.Bookings), "the new party has a list of its own");

var three = two.Add(third);
Check.Equal(three.Bookings.Count, 3, "a party with three bookings");
Check.True(three.Bookings[2] == third, "the third booking is last");
Check.Equal(two.Bookings.Count, 2, "adding to the second party leaves it with two bookings");
Check.Equal(original.Bookings.Count, 1, "adding to the second party leaves the first with one booking");

// Two parties built from the same original do not share bookings.
var branch = original.Add(third);
Check.Equal(branch.Bookings.Count, 2, "a second party built from the original");
Check.True(branch.Bookings[1] == third, "the second party built from the original ends with its own booking");
Check.True(two.Bookings[1] == second, "the first party built from the original keeps its own booking");

// An empty party.
var empty = new Party("Kim", new List<Booking>());
var one = empty.Add(first);
Check.Equal(one.Bookings.Count, 1, "a booking added to an empty party");
Check.Equal(empty.Bookings.Count, 0, "the empty party stays empty");
