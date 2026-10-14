// Hotel Bill
//
// An abstract base class with one abstract and two virtual members, three
// derived classes that override what they change, and a bill that works
// through base-class variables.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// <summary>A room booked for a number of nights. Complete: do not change it.</summary>
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

    public override decimal NightlyRate => throw new NotImplementedException();

    // TODO 1: replace Name.
}

public class Suite : Room
{
    public Suite(int number, int nights, bool breakfast) : base(number, nights)
    {
        throw new NotImplementedException();
    }

    public bool Breakfast { get; }

    public override decimal NightlyRate => throw new NotImplementedException();

    // TODO 2: replace Name and Total().
}

public sealed class FamilyRoom : Standard
{
    public FamilyRoom(int number, int nights, int children) : base(number, nights)
    {
        throw new NotImplementedException();
    }

    public int Children { get; }

    // TODO 3: replace NightlyRate and Name.
}

public static class FrontDesk
{
    /// <summary>The total of all the rooms' stays.</summary>
    public static decimal Bill(List<Room> rooms)
    {
        throw new NotImplementedException();
    }
}
