// Campsite Desk
//
// The tests call the three methods below. Each one is nearly complete:
// write only where a comment says YOUR CODE, and keep the last line of each
// method, which hands the result back to the tests.
//
// The names in the parentheses, such as nights, are variables that the
// tests fill in before your code runs. Use them like any other variable.
// Lesson 8 explains the rest of the first line of each method, such as
// "public static" and "decimal", so leave it as it is.

static class Campsite
{
    // What a stay of a number of nights costs.
    public static decimal StayCost(int nights)
    {
        // YOUR CODE (task 1): declare a constant named PricePerNight of type
        // decimal with the value 18.50, then multiply by it instead of by 0m.
        decimal cost = nights * 0m;

        return cost;
    }

    // The sign that points a guest to the pitch after the last one taken.
    public static string NextPitchSign(int lastTaken)
    {
        // YOUR CODE (task 2): for 7 this gives "Next free pitch: 71". Fix it
        // so that it gives "Next free pitch: 8".
        string sign = "Next free pitch: " + lastTaken + 1;

        return sign;
    }

    // The tag that hangs on a guest's tent.
    public static string TentTag(string guest, int nights, char field, bool dog)
    {
        // YOUR CODE (task 3): build the tag with string interpolation.
        string tag = "";

        return tag;
    }
}
