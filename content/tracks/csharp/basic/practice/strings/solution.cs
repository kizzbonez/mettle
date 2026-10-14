// Parcel Labels
//
// The tests call the four methods below.

static class PostOffice
{
    // The tracking code without the spaces around it, in upper case.
    public static string TidyCode(string code)
    {
        string tidy = code.Trim().ToUpper();

        return tidy;
    }

    // "Ada Okafor" is filed as "OKAFOR, Ada".
    public static string FileAs(string fullName)
    {
        int space = fullName.IndexOf(' ');
        string first = fullName.Substring(0, space);
        string surname = fullName.Substring(space + 1);
        string filed = $"{surname.ToUpper()}, {first}";

        return filed;
    }

    // One aligned line for a shelf, such as "|Lagos     |   3|   12.50|".
    public static string ShelfLine(string city, int parcels, decimal kilos)
    {
        string line = $"|{city,-10}|{parcels,4}|{kilos,8:F2}|";

        return line;
    }

    // Whether two city names are the same, ignoring the spaces around them
    // and upper and lower case.
    public static bool SameCity(string a, string b)
    {
        bool same = string.Equals(a.Trim(), b.Trim(), StringComparison.OrdinalIgnoreCase);

        return same;
    }
}
