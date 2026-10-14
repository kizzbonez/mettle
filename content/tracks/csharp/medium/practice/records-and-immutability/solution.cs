// Theatre Booking
//
// A record struct with value equality, a record whose copies are made with
// `with`, a computed property that stays right on every copy, and a record
// whose list must not be shared by accident.

/// <summary>A seat, such as C7. The compiler writes equality, ToString and Deconstruct.</summary>
public readonly record struct Seat(char Row, int Number);

/// <summary>One seat booked for one person.</summary>
public record Booking(string Name, Seat Seat, decimal Price)
{
    public bool Paid { get; init; }

    /// <summary>The text on the ticket, such as "Ada, C7, 42.50" or "Ada, C7, 42.50, paid".</summary>
    public string Ticket => Paid
        ? $"{Name}, {Seat.Row}{Seat.Number}, {Price:0.00}, paid"
        : $"{Name}, {Seat.Row}{Seat.Number}, {Price:0.00}";

    /// <summary>A paid copy of this booking.</summary>
    public Booking Pay() => this with { Paid = true };

    /// <summary>A copy of this booking at another seat.</summary>
    public Booking MoveTo(Seat seat) => this with { Seat = seat };
}

/// <summary>Bookings made together by one organiser.</summary>
public record Party(string Organiser, List<Booking> Bookings)
{
    /// <summary>A new party with one more booking; this party and its list stay as they are.</summary>
    public Party Add(Booking booking) =>
        this with { Bookings = new List<Booking>(Bookings) { booking } };   // a new list, not the shared one
}
