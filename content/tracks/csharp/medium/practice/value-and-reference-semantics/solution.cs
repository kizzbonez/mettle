// Car Park Gate
//
// Value equality for a class, so that a HashSet can find the same car written
// two ways, and a ref parameter that replaces the caller's struct.

/// <summary>A number plate, as the camera read it or the attendant typed it.</summary>
public class Plate
{
    public Plate(string code) => Code = code;

    /// <summary>The code exactly as it was typed.</summary>
    public string Code { get; }

    /// <summary>The code without spaces, in capitals: what equality compares.</summary>
    private string Key => Code.Replace(" ", "").ToUpperInvariant();

    public override string ToString() => Code;

    /// <summary>True when the other object is a plate of the same car.</summary>
    public override bool Equals(object? obj) => obj is Plate other && other.Key == Key;

    /// <summary>Built from exactly what Equals compares, so equal plates hash alike.</summary>
    public override int GetHashCode() => Key.GetHashCode();
}

/// <summary>A ticket from the machine at the barrier.</summary>
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
    public int Count => inside.Count;

    /// <summary>Lets a car in; false if that car is already inside.</summary>
    public bool Enter(Plate plate) => inside.Add(plate);

    /// <summary>Lets a car out; false if that car was not inside.</summary>
    public bool Leave(Plate plate) => inside.Remove(plate);

    /// <summary>Replaces the caller's ticket with one that has more minutes.</summary>
    public static void Extend(ref ParkingTicket ticket, int minutes)
    {
        if (minutes <= 0) throw new ArgumentOutOfRangeException(nameof(minutes));
        ticket = new ParkingTicket(ticket.Plate, ticket.Minutes + minutes);   // the caller's variable
    }
}
