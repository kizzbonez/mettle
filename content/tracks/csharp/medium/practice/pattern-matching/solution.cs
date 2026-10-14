// Smart Home Hub
//
// Three switch expressions: relational patterns for a temperature, type,
// property and positional patterns for messages of any kind, and list
// patterns for spoken commands.

/// <summary>A reading from the thermometer in a room.</summary>
public record Thermometer(string Room, double Celsius);

/// <summary>A report from a door sensor.</summary>
public record Door(string Name, bool Open, bool Locked);

public static class Hub
{
    /// <summary>cold, comfortable, warm, or no reading for NaN.</summary>
    public static string Comfort(double celsius) => celsius switch
    {
        < 16 => "cold",
        < 24 => "comfortable",   // arms run in order, so this one needs no lower bound
        >= 24 => "warm",
        _ => "no reading",       // NaN fails every comparison
    };

    /// <summary>One line about any message the hub receives.</summary>
    public static string Describe(object? message) => message switch
    {
        null => "nothing",
        Thermometer(var room, var celsius) => $"{room}: {Comfort(celsius)}",
        Door { Open: true } door => $"{door.Name} door is open",
        Door { Locked: true } door => $"{door.Name} door is locked",
        Door door => $"{door.Name} door is closed",
        string { Length: 0 } => "empty note",
        string text => $"note: {text}",
        _ => "unknown message",
    };

    /// <summary>What the hub does for a spoken command, split into words.</summary>
    public static string Command(string[] words) => words switch
    {
        [] => "say something",
        ["lights", var state] when state is "on" or "off" => $"lights {state}",
        ["heat", var text] when int.TryParse(text, out int degrees) && degrees is >= 5 and <= 30
            => $"heating to {degrees}",
        ["play", var name] => $"playing {name}",
        ["play", var first, .. var rest] => $"playing {first} and {rest.Length} more",
        [var verb, ..] => $"unknown command: {verb}",
    };
}
