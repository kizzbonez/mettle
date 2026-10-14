// Parcel Labels
//
// The scanner service of a parcel hub reads each parcel's dimensions, prints a
// tracking label and cleans up the delivery address, three hundred thousand
// times an hour. With spans, stackalloc and a pooled buffer, the first two
// allocate nothing and the third allocates only the string it returns.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

using System.Buffers;
using System.Globalization;

public static class Labels
{
    /// <summary>The longest address that is normalised in a buffer on the stack.</summary>
    public const int StackLimit = 256;

    /// <summary>Reads "40x30x25" (length, width, height in centimetres). Allocates nothing.</summary>
    public static bool TryParseDimensions(ReadOnlySpan<char> text, out int length, out int width, out int height)
    {
        throw new NotImplementedException();
    }

    /// <summary>Writes "LHR-00040917" into <paramref name="destination"/>. Allocates nothing.</summary>
    public static bool TryFormatLabel(Span<char> destination, ReadOnlySpan<char> depot, int parcel, out int written)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Trims the address, turns every run of whitespace into one space and
    /// ASCII letters into upper case. Allocates only the string it returns.
    /// </summary>
    public static string Normalise(ReadOnlySpan<char> address, ArrayPool<char> pool)
    {
        // TODO: a buffer from stackalloc up to StackLimit characters, rented
        //       from `pool` above that, and returned to it in a finally block.
        throw new NotImplementedException();
    }
}
