var booking = new Booking("Eve", new Seat('B', 11), 9m);

// The ticket.
Check.Equal(booking.Ticket, "Eve, B11, 9.00", "a whole-number price is shown with two decimals");
Check.Equal(new Booking("Fin", new Seat('A', 3), 12.5m).Ticket, "Fin, A3, 12.50", "a price of 12.5 is shown with two decimals");
Check.Equal(new Booking("Gil", new Seat('K', 20), 30m) { Paid = true }.Ticket, "Gil, K20, 30.00, paid", "a booking created as paid");

// Pay
var paid = booking.Pay();
Check.True(paid.Paid, "the copy from Pay is paid");
Check.Equal(paid.Name, "Eve", "Pay keeps the name");
Check.True(paid.Seat == new Seat('B', 11), "Pay keeps the seat");
Check.Equal(paid.Price, 9m, "Pay keeps the price");
Check.True(!booking.Paid, "the booking Pay was called on stays unpaid");
Check.Equal(booking.Ticket, "Eve, B11, 9.00", "the ticket of the original after Pay");
Check.True(paid.Pay() == paid, "paying a paid booking gives an equal booking");
Check.True(!ReferenceEquals(paid, booking), "Pay returns a new booking object");

// MoveTo
var moved = booking.MoveTo(new Seat('E', 4));
Check.True(moved.Seat == new Seat('E', 4), "MoveTo gives the new seat");
Check.Equal(moved.Ticket, "Eve, E4, 9.00", "the ticket of the moved copy is computed for its own seat");
Check.True(booking.Seat == new Seat('B', 11), "the booking MoveTo was called on keeps its seat");
Check.Equal(booking.Ticket, "Eve, B11, 9.00", "the ticket of the original after MoveTo");
Check.True(!moved.Paid, "moving an unpaid booking leaves it unpaid");

var paidAndMoved = paid.MoveTo(new Seat('E', 5));
Check.True(paidAndMoved.Paid, "moving a paid booking keeps it paid");
Check.Equal(paidAndMoved.Ticket, "Eve, E5, 9.00, paid", "the ticket of a paid booking moved to E5");
Check.True(paid.Seat == new Seat('B', 11), "the paid booking keeps its seat after a move");

// Value equality of the record.
Check.True(booking.MoveTo(new Seat('B', 11)) == booking, "moving a booking to the seat it has gives an equal booking");
Check.True(booking.Pay() != booking, "a paid copy is not equal to the unpaid original");
Check.True(booking.MoveTo(new Seat('E', 5)).Pay() == paidAndMoved, "paying and then moving, or moving and then paying, give equal bookings");
