// Farm Shop
//
// Two interfaces that become variant, a generic method over them, a spread
// that works for every number type through generic math, and a barcode reader
// that calls static abstract members through its type parameter.

using System.Numerics;

public record Fruit(string Name);

public sealed record Apple(string Name) : Fruit(Name), IScanned<Apple>
{
    public static string Prefix => "APL";
    public static Apple FromCode(string code) => new(code);
}

public sealed record Pear(string Name) : Fruit(Name), IScanned<Pear>
{
    public static string Prefix => "PEA";
    public static Pear FromCode(string code) => new(code);
}

/// A type that the till can build from a barcode such as "APL-gala".
public interface IScanned<TSelf> where TSelf : IScanned<TSelf>
{
    /// The letters before the dash, such as "APL".
    static abstract string Prefix { get; }

    /// Builds one item from the text after the dash.
    static abstract TSelf FromCode(string code);
}

/// A stall only hands its items out: T appears only as a result, so it can be `out`.
public interface IStall<out T>
{
    int Count { get; }
    T Show(int index);
}

/// An inspector only takes items in: T appears only as a parameter, so it can be `in`.
public interface IInspector<in T>
{
    bool Passes(T item);
}

public sealed class Stall<T>(params T[] items) : IStall<T>
{
    public int Count => items.Length;
    public T Show(int index) => items[index];
}

public sealed class Inspector<T>(Func<T, bool> rule) : IInspector<T>
{
    public bool Passes(T item) => rule(item);
}

public static class Market
{
    /// The items of the stall that pass the inspection, in stall order.
    public static List<T> Accepted<T>(IStall<T> stall, IInspector<T> inspector)
    {
        var accepted = new List<T>();
        for (int i = 0; i < stall.Count; i++)
        {
            T item = stall.Show(i);
            if (inspector.Passes(item)) accepted.Add(item);
        }
        return accepted;
    }

    /// The largest value minus the smallest, or zero for no values.
    public static T Spread<T>(IReadOnlyList<T> values) where T : INumber<T>
    {
        if (values.Count == 0) return T.Zero;
        T smallest = values[0];
        T largest = values[0];
        foreach (T value in values)
        {
            if (value < smallest) smallest = value;
            if (value > largest) largest = value;
        }
        return largest - smallest;
    }

    /// The items of type T found among the barcodes, in order.
    public static List<T> Scan<T>(IEnumerable<string> barcodes) where T : IScanned<T>
    {
        // A static member, looked up through the type parameter.
        string start = T.Prefix + "-";
        var found = new List<T>();
        foreach (string barcode in barcodes)
        {
            if (barcode.StartsWith(start, StringComparison.Ordinal))
                found.Add(T.FromCode(barcode[start.Length..]));
        }
        return found;
    }
}
