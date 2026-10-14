// Photo Filters
//
// A delegate type for brightness filters, a method that takes one as an
// argument, methods that build new ones from lambdas, and a closure that
// keeps a count between calls.

/// <summary>A change to one brightness level, 0 for black to 255 for white.</summary>
public delegate int Adjust(int level);

public static class Darkroom
{
    /// <summary>A new array with every level adjusted; the given array is left alone.</summary>
    public static int[] Apply(int[] levels, Adjust adjust)
    {
        var result = new int[levels.Length];
        for (int i = 0; i < levels.Length; i++)
        {
            result[i] = adjust(levels[i]);   // calling the delegate calls the method
        }
        return result;
    }

    /// <summary>An adjustment that adds the amount and stays between 0 and 255.</summary>
    public static Adjust Brighter(int amount) =>
        level => Math.Clamp(level + amount, 0, 255);   // captures amount

    /// <summary>One adjustment that runs every step in order.</summary>
    public static Adjust Chain(params Adjust[] steps) =>
        level =>
        {
            foreach (Adjust step in steps)
            {
                level = step(level);
            }
            return level;
        };

    /// <summary>A function that names files PREFIX_001, PREFIX_002 and so on.</summary>
    public static Func<string> Namer(string prefix)
    {
        int count = 0;   // captured: it lives as long as the function does
        return () =>
        {
            count++;
            return $"{prefix}_{count:000}";
        };
    }
}
