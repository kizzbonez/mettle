// Car Park Gate
//
// Value equality for a class, so that a HashSet can find the same car written
// two ways, and a ref parameter that replaces the caller's struct.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// <summary>A number plate, as the camera read it or the attendant typed it.</summary>
public class Plate
{
    // Complete: nothing to write here.
    public Plate(string code) => Code = code;

    /// <summary>The code exactly as it was typed.</summary>
    public string Code { get; }

    public override string ToString() => Code;

    /// <summary>True when the other object is a plate of the same car.</summary>
    public override bool Equals(object? obj)
    {
        throw new NotImplementedException();
    }

    /// <summary>Equal plates must give equal hash codes.</summary>
    public override int GetHashCode()
    {
        throw new NotImplementedException();
    }
}

/// <summary>A ticket from the machine at the barrier. Complete: do not change it.</summary>
public readonly struct ParkingTicket
{
    public ParkingTicket(Plate plate, int minutes)
    {
        Plate = plate;
        Minutes = minutes;
    }

    public Plate Plate { get; }
    public int Minutes { get; }
}

/// <summary>The cars that are inside the car park.</summary>
public class CarPark
{
    private readonly HashSet<Plate> inside = new();

    /// <summary>The number of cars inside.</summary>
    public int Count => throw new NotImplementedException();

    /// <summary>Lets a car in; false if that car is already inside.</summary>
    public bool Enter(Plate plate)
    {
        throw new NotImplementedException();
    }

    /// <summary>Lets a car out; false if that car was not inside.</summary>
    public bool Leave(Plate plate)
    {
        throw new NotImplementedException();
    }

    /// <summary>Replaces the caller's ticket with one that has more minutes.</summary>
    public static void Extend(ref ParkingTicket ticket, int minutes)
    {
        throw new NotImplementedException();
    }
}
