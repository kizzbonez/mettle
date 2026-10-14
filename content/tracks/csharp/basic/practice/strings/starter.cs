// Parcel Labels
//
// The tests call the four methods below. Each one is nearly complete:
// write only where a comment says YOUR CODE, and keep the last line of each
// method, which hands the result back to the tests.

static class PostOffice
{
    // The tracking code without the spaces around it, in upper case.
    public static string TidyCode(string code)
    {
        // YOUR CODE (task 1): replace the empty string.
        string tidy = "";

        return tidy;
    }

    // "Ada Okafor" is filed as "OKAFOR, Ada".
    public static string FileAs(string fullName)
    {
        // YOUR CODE (task 2): find the space, cut out the two names, and
        // build the text the parcel is filed under.
        string filed = "";

        return filed;
    }

    // One aligned line for a shelf, such as "|Lagos     |   3|   12.50|".
    public static string ShelfLine(string city, int parcels, decimal kilos)
    {
        // YOUR CODE (task 3): replace the empty string with an interpolated
        // string that uses widths and a format specifier.
        string line = "";

        return line;
    }

    // Whether two city names are the same, ignoring the spaces around them
    // and upper and lower case.
    public static bool SameCity(string a, string b)
    {
        // YOUR CODE (task 4): replace false.
        bool same = false;

        return same;
    }
}
