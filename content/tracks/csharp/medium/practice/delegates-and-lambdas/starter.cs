// Photo Filters
//
// A delegate type for brightness filters, a method that takes one as an
// argument, methods that build new ones from lambdas, and a closure that
// keeps a count between calls.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// <summary>A change to one brightness level, 0 for black to 255 for white. Complete.</summary>
public delegate int Adjust(int level);

public static class Darkroom
{
    /// <summary>A new array with every level adjusted; the given array is left alone.</summary>
    public static int[] Apply(int[] levels, Adjust adjust)
    {
        throw new NotImplementedException();
    }

    /// <summary>An adjustment that adds the amount and stays between 0 and 255.</summary>
    public static Adjust Brighter(int amount)
    {
        throw new NotImplementedException();
    }

    /// <summary>One adjustment that runs every step in order.</summary>
    public static Adjust Chain(params Adjust[] steps)
    {
        throw new NotImplementedException();
    }

    /// <summary>A function that names files PREFIX_001, PREFIX_002 and so on.</summary>
    public static Func<string> Namer(string prefix)
    {
        throw new NotImplementedException();
    }
}
