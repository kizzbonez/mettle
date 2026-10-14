// Campsite Desk
//
// The tests call the three methods below.

static class Campsite
{
    // What a stay of a number of nights costs.
    public static decimal StayCost(int nights)
    {
        const decimal PricePerNight = 18.50m;
        decimal cost = nights * PricePerNight;

        return cost;
    }

    // The sign that points a guest to the pitch after the last one taken.
    public static string NextPitchSign(int lastTaken)
    {
        string sign = $"Next free pitch: {lastTaken + 1}";

        return sign;
    }

    // The tag that hangs on a guest's tent.
    public static string TentTag(string guest, int nights, char field, bool dog)
    {
        string tag = $"{guest} | nights: {nights} | field: {field} | dog: {dog}";

        return tag;
    }
}
