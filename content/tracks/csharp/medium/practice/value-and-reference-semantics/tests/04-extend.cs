var plate = new Plate("LM65 TRV");
var ticket = new ParkingTicket(plate, 45);

CarPark.Extend(ref ticket, 15);
Check.Equal(ticket.Minutes, 60, "the minutes after one extension");
Check.True(ReferenceEquals(ticket.Plate, plate), "the extended ticket keeps the same plate object");

CarPark.Extend(ref ticket, 1);
CarPark.Extend(ref ticket, 120);
Check.Equal(ticket.Minutes, 181, "the minutes after three extensions, each added to the last");

// A copy is a separate value.
var before = ticket;
CarPark.Extend(ref ticket, 10);
Check.Equal(before.Minutes, 181, "a copy taken before an extension keeps its minutes");
Check.Equal(ticket.Minutes, 191, "the ticket passed with ref is the one that changes");

// Minutes that are not positive.
var refused = new ParkingTicket(plate, 30);
Check.Throws<ArgumentOutOfRangeException>(() => CarPark.Extend(ref refused, 0), "an extension of 0 minutes");
Check.Equal(refused.Minutes, 30, "a refused extension of 0 minutes leaves the ticket as it was");
Check.Throws<ArgumentOutOfRangeException>(() => CarPark.Extend(ref refused, -20), "an extension of a negative number of minutes");
Check.Equal(refused.Minutes, 30, "a refused negative extension leaves the ticket as it was");
Check.True(ReferenceEquals(refused.Plate, plate), "a refused extension keeps the plate");

// Each ticket in an array is its own variable.
var tickets = new[] { new ParkingTicket(new Plate("A1"), 10), new ParkingTicket(new Plate("B2"), 20) };
CarPark.Extend(ref tickets[1], 5);
Check.Equal(tickets[1].Minutes, 25, "an array element passed with ref is extended in place");
Check.Equal(tickets[0].Minutes, 10, "the other element of the array is not changed");
