// Parcel Labels
//
// The scanner service of a parcel hub reads each parcel's dimensions, prints a
// tracking label and cleans up the delivery address, three hundred thousand
// times an hour. With spans, stackalloc and a pooled buffer, the first two
// allocate nothing and the third allocates only the string it returns.

using System.Buffers;
using System.Globalization;

public static class Labels
{
    /// <summary>The longest address that is normalised in a buffer on the stack.</summary>
    public const int StackLimit = 256;

    /// <summary>Reads "40x30x25" (length, width, height in centimetres). Allocates nothing.</summary>
    public static bool TryParseDimensions(ReadOnlySpan<char> text, out int length, out int width, out int height)
    {
        length = width = height = 0;
        ReadOnlySpan<char> trimmed = text.Trim();
        Span<int> sides = stackalloc int[3];
        int count = 0;
        foreach (Range part in trimmed.Split('x'))
        {
            if (count == 3) return false;   // a fourth part
            if (!int.TryParse(trimmed[part], NumberStyles.None, CultureInfo.InvariantCulture, out int side) || side < 1)
                return false;
            sides[count++] = side;
        }
        if (count != 3) return false;
        (length, width, height) = (sides[0], sides[1], sides[2]);
        return true;
    }

    /// <summary>Writes "LHR-00040917" into <paramref name="destination"/>. Allocates nothing.</summary>
    public static bool TryFormatLabel(Span<char> destination, ReadOnlySpan<char> depot, int parcel, out int written)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(parcel);
        written = 0;
        if (destination.Length <= depot.Length) return false;   // no room for the hyphen
        depot.CopyTo(destination);
        destination[depot.Length] = '-';
        if (!parcel.TryFormat(destination[(depot.Length + 1)..], out int digits, "D8", CultureInfo.InvariantCulture))
            return false;
        written = depot.Length + 1 + digits;
        return true;
    }

    /// <summary>
    /// Trims the address, turns every run of whitespace into one space and
    /// ASCII letters into upper case. Allocates only the string it returns.
    /// </summary>
    public static string Normalise(ReadOnlySpan<char> address, ArrayPool<char> pool)
    {
        char[]? rented = null;
        Span<char> buffer = address.Length <= StackLimit
            ? stackalloc char[StackLimit]
            : (rented = pool.Rent(address.Length));
        try
        {
            int written = 0;
            bool inSpace = false;
            foreach (char c in address.Trim())
            {
                if (char.IsWhiteSpace(c))
                {
                    inSpace = true;
                    continue;
                }
                if (inSpace) buffer[written++] = ' ';
                inSpace = false;
                buffer[written++] = char.IsAsciiLetterLower(c) ? (char)(c - 'a' + 'A') : c;
            }
            // Only the part that was written: a rented array is longer, and holds old data.
            return new string(buffer[..written]);
        }
        finally
        {
            if (rented is not null) pool.Return(rented);
        }
    }
}
