// Theatre Booking
//
// A record struct with value equality, a record whose copies are made with
// `with`, a computed property that stays right on every copy, and a record
// whose list must not be shared by accident.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

// TODO 1: replace this class with a positional readonly record struct with the same two properties.
public class Seat
{
    public Seat(char row, int number)
    {
        Row = row;
        Number = number;
    }

    public char Row { get; }
    public int Number { get; }
}

/// <summary>One seat booked for one person.</summary>
public record Booking(string Name, Seat Seat, decimal Price)
{
    public bool Paid { get; init; }

    /// <summary>The text on the ticket, such as "Ada, C7, 42.50" or "Ada, C7, 42.50, paid".</summary>
    public string Ticket => throw new NotImplementedException();

    /// <summary>A paid copy of this booking.</summary>
    public Booking Pay()
    {
        throw new NotImplementedException();
    }

    /// <summary>A copy of this booking at another seat.</summary>
    public Booking MoveTo(Seat seat)
    {
        throw new NotImplementedException();
    }
}

/// <summary>Bookings made together by one organiser.</summary>
public record Party(string Organiser, List<Booking> Bookings)
{
    /// <summary>A new party with one more booking; this party and its list stay as they are.</summary>
    public Party Add(Booking booking)
    {
        throw new NotImplementedException();
    }
}
