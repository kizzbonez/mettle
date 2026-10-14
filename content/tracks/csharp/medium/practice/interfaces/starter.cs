// Race Results
//
// An interface with a default method, implemented by a class and a struct,
// the two standard interfaces that let a List sort and search your type,
// and a method that works with any finisher.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// <summary>Anything that crossed the finish line with a time.</summary>
public interface ITimed
{
    string Name { get; }
    int Seconds { get; }

    /// <summary>The line on the results board, such as "Ada 41:05". A default method.</summary>
    string Result() => throw new NotImplementedException();
}

/// <summary>A single runner.</summary>
public class Runner : ITimed, IComparable<Runner>, IEquatable<Runner>
{
    // Complete: nothing to write here.
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
        throw new NotImplementedException();
    }

    /// <summary>The same name and the same time.</summary>
    public bool Equals(Runner? other)
    {
        throw new NotImplementedException();
    }

    public override bool Equals(object? obj)
    {
        throw new NotImplementedException();
    }

    public override int GetHashCode()
    {
        throw new NotImplementedException();
    }

    public override string ToString() => $"{Name} ({Seconds} s)";
}

/// <summary>A relay team. Its legs are run one after another.</summary>
public readonly struct Relay : ITimed
{
    private readonly int[] legs;

    // Complete: nothing to write here.
    public Relay(string team, int[] legs)
    {
        Name = team;
        this.legs = legs;
    }

    public string Name { get; }

    /// <summary>The time of the whole team.</summary>
    public int Seconds => throw new NotImplementedException();
}

public static class Results
{
    /// <summary>The entry with the fewest seconds; on a tie, the first in the list.</summary>
    public static ITimed Winner(List<ITimed> entries)
    {
        throw new NotImplementedException();
    }
}
