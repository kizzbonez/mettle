// Hotel Bill
//
// An abstract base class with one abstract and two virtual members, three
// derived classes that override what they change, and a bill that works
// through base-class variables.

/// <summary>A room booked for a number of nights.</summary>
public abstract class Room
{
    protected Room(int number, int nights)
    {
        Number = number;
        Nights = nights;
    }

    public int Number { get; }
    public int Nights { get; }

    /// <summary>The price of one night. Every kind of room must say.</summary>
    public abstract decimal NightlyRate { get; }

    /// <summary>What the bill calls the room. A kind of room may replace it.</summary>
    public virtual string Name => "room";

    /// <summary>The price of the whole stay. A kind of room may replace it.</summary>
    public virtual decimal Total() => NightlyRate * Nights;

    /// <summary>One line of the bill, written once for every kind of room.</summary>
    public string BillLine() => $"Room {Number}, {Name}, {Nights} nights: {Total():0.00}";
}

public class Standard : Room
{
    public Standard(int number, int nights) : base(number, nights) { }

    public override decimal NightlyRate => 90m;

    public override string Name => "standard room";
}

public class Suite : Room
{
    public Suite(int number, int nights, bool breakfast) : base(number, nights)
    {
        Breakfast = breakfast;
    }

    public bool Breakfast { get; }

    public override decimal NightlyRate => 210m;

    public override string Name => "suite";

    // The base works out the nights; the suite adds what only it has.
    public override decimal Total() => Breakfast ? base.Total() + 18m * Nights : base.Total();
}

public sealed class FamilyRoom : Standard
{
    public FamilyRoom(int number, int nights, int children) : base(number, nights)
    {
        Children = children;
    }

    public int Children { get; }

    // An override can itself be overridden: Standard's rate is the starting point.
    public override decimal NightlyRate => base.NightlyRate + 15m * Children;

    public override string Name => "family room";
}

public static class FrontDesk
{
    /// <summary>The total of all the rooms' stays.</summary>
    public static decimal Bill(List<Room> rooms)
    {
        decimal total = 0;
        foreach (Room room in rooms)
        {
            total += room.Total();   // each room's own Total runs
        }
        return total;
    }
}
