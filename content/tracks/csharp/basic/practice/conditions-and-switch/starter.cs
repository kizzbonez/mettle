// Lift Passes
//
// The tests call the four methods below. Each one declares its result
// variable first: write only where a comment says YOUR CODE, assign the
// variable there, and keep the last line, which hands it back to the tests.

static class SkiHill
{
    // The price of a day pass for a skier of this age.
    public static decimal PassPrice(int age)
    {
        decimal price = -1m;
        // YOUR CODE (task 1): give price its value with if, else if and else.

        return price;
    }

    // Whether a skier of this height may ride the chairlift.
    public static bool MayRide(int heightCm, bool withAdult)
    {
        // YOUR CODE (task 2): replace false with one condition.
        bool allowed = false;

        return allowed;
    }

    // The level of a run, from the colour of its sign.
    public static string RunLevel(string colour)
    {
        string level = "";
        // YOUR CODE (task 3): give level its value with a switch.

        return level;
    }

    // The sign that says how many runs are open.
    public static string OpenRunsSign(int open)
    {
        // YOUR CODE (task 4): replace the empty string. Use ?: to choose
        // between "run" and "runs".
        string sign = "";

        return sign;
    }
}
