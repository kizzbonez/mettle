// Race Results
//
// An interface with a default method, implemented by a class and a struct,
// the two standard interfaces that let a List sort and search your type,
// and a method that works with any finisher.

/// <summary>Anything that crossed the finish line with a time.</summary>
public interface ITimed
{
    string Name { get; }
    int Seconds { get; }

    /// <summary>The line on the results board, such as "Ada 41:05". A default method.</summary>
    string Result() => $"{Name} {Seconds / 60}:{Seconds % 60:00}";
}

/// <summary>A single runner.</summary>
public class Runner : ITimed, IComparable<Runner>, IEquatable<Runner>
{
    public Runner(string name, int seconds)
    {
        Name = name;
        Seconds = seconds;
    }

    public string Name { get; }
    public int Seconds { get; }

    /// <summary>Faster first; equal times by name. Every runner sorts after null.</summary>
    public int CompareTo(Runner? other)
    {
        if (other is null) return 1;
        int byTime = Seconds.CompareTo(other.Seconds);   // the most significant part first
        return byTime != 0 ? byTime : string.CompareOrdinal(Name, other.Name);
    }

    /// <summary>The same name and the same time.</summary>
    public bool Equals(Runner? other) =>
        other is not null && Name == other.Name && Seconds == other.Seconds;

    public override bool Equals(object? obj) => Equals(obj as Runner);

    public override int GetHashCode() => HashCode.Combine(Name, Seconds);

    public override string ToString() => $"{Name} ({Seconds} s)";
}

/// <summary>A relay team. Its legs are run one after another.</summary>
public readonly struct Relay : ITimed
{
    private readonly int[] legs;

    public Relay(string team, int[] legs)
    {
        Name = team;
        this.legs = legs;
    }

    public string Name { get; }

    /// <summary>The time of the whole team.</summary>
    public int Seconds
    {
        get
        {
            int total = 0;
            foreach (int leg in legs)
            {
                total += leg;
            }
            return total;
        }
    }
}

public static class Results
{
    /// <summary>The entry with the fewest seconds; on a tie, the first in the list.</summary>
    public static ITimed Winner(List<ITimed> entries)
    {
        ITimed best = entries[0];
        foreach (ITimed entry in entries)
        {
            if (entry.Seconds < best.Seconds) best = entry;   // strictly faster, so ties keep the first
        }
        return best;
    }
}
