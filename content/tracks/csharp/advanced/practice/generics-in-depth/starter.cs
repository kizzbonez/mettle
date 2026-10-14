// Farm Shop
//
// Two interfaces that become variant, a generic method over them, a spread
// that works for every number type through generic math, and a barcode reader
// that calls static abstract members through its type parameter.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

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

/// A stall only hands its items out.
// TODO 1: make T covariant
public interface IStall<T>
{
    int Count { get; }
    T Show(int index);
}

/// An inspector only takes items in, to look at them.
// TODO 1: make T contravariant
public interface IInspector<T>
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
        // TODO 2
        throw new NotImplementedException();
    }

    /// The largest value minus the smallest, or zero for no values.
    public static T Spread<T>(IReadOnlyList<T> values) where T : INumber<T>
    {
        // TODO 3
        throw new NotImplementedException();
    }

    /// The items of type T found among the barcodes, in order.
    public static List<T> Scan<T>(IEnumerable<string> barcodes) where T : IScanned<T>
    {
        // TODO 4
        throw new NotImplementedException();
    }
}
