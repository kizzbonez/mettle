// The example from the instructions.
var a = new Plate("AB12 CDE");
var b = new Plate("ab12cde");
Check.True(a.Equals(b), "Equals for AB12 CDE and ab12cde");
Check.True(!(a == b), "== for two different plate objects");
Check.True(a.GetHashCode() == b.GetHashCode(), "the hash codes of AB12 CDE and ab12cde");

var park = new CarPark();
Check.True(park.Enter(a), "the first car enters an empty car park");
Check.True(!park.Enter(b), "the same car, typed another way, enters again");
Check.Equal(park.Count, 1, "the cars inside after one car entered twice");
Check.True(park.Leave(new Plate("AB 12 CDE")), "the car leaves, typed a third way");
Check.Equal(park.Count, 0, "the cars inside after it left");

var ticket = new ParkingTicket(a, 60);
var copy = ticket;
CarPark.Extend(ref ticket, 30);
Check.Equal(ticket.Minutes, 90, "the minutes on a 60-minute ticket extended by 30");
Check.Equal(copy.Minutes, 60, "the minutes on the copy taken before the extension");
