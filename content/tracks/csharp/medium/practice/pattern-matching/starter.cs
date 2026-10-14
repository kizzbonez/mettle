// Smart Home Hub
//
// Three switch expressions: relational patterns for a temperature, type,
// property and positional patterns for messages of any kind, and list
// patterns for spoken commands.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// <summary>A reading from the thermometer in a room. Complete: do not change it.</summary>
public record Thermometer(string Room, double Celsius);

/// <summary>A report from a door sensor. Complete: do not change it.</summary>
public record Door(string Name, bool Open, bool Locked);

public static class Hub
{
    /// <summary>cold, comfortable, warm, or no reading for NaN.</summary>
    public static string Comfort(double celsius)
    {
        throw new NotImplementedException();
    }

    /// <summary>One line about any message the hub receives.</summary>
    public static string Describe(object? message)
    {
        throw new NotImplementedException();
    }

    /// <summary>What the hub does for a spoken command, split into words.</summary>
    public static string Command(string[] words)
    {
        throw new NotImplementedException();
    }
}
