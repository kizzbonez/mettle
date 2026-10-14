// The example from the instructions.
var seat = new Seat('C', 7);
Check.True(seat == new Seat('C', 7), "== on two seats with the same row and number");
Check.Equal(seat.ToString(), "Seat { Row = C, Number = 7 }", "the text of a seat");

var booking = new Booking("Ada", seat, 42.50m);
Check.Equal(booking.Ticket, "Ada, C7, 42.50", "the ticket of an unpaid booking");
var paid = booking.Pay();
Check.Equal(paid.Ticket, "Ada, C7, 42.50, paid", "the ticket of the paid copy");
var moved = paid.MoveTo(new Seat('D', 2));
Check.Equal(moved.Ticket, "Ada, D2, 42.50, paid", "the ticket of the paid copy moved to D2");
Check.True(!booking.Paid, "the original booking after Pay and MoveTo");

var party = new Party("Bo", [booking]);
var bigger = party.Add(new Booking("Cy", new Seat('C', 8), 42.50m));
Check.Equal(bigger.Bookings.Count, 2, "the bookings in the new party");
Check.Equal(party.Bookings.Count, 1, "the bookings in the original party");
