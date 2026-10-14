// Lift Passes
//
// The tests call the four methods below.

static class SkiHill
{
    // The price of a day pass for a skier of this age.
    public static decimal PassPrice(int age)
    {
        decimal price = -1m;
        if (age < 6)
        {
            price = 0m;
        }
        else if (age <= 15)
        {
            price = 25m;
        }
        else if (age <= 64)
        {
            price = 48m;
        }
        else
        {
            price = 30m;
        }

        return price;
    }

    // Whether a skier of this height may ride the chairlift.
    public static bool MayRide(int heightCm, bool withAdult)
    {
        bool allowed = heightCm >= 125 || (heightCm >= 100 && withAdult);

        return allowed;
    }

    // The level of a run, from the colour of its sign.
    public static string RunLevel(string colour)
    {
        string level = "";
        level = colour switch
        {
            "green" => "beginner",
            "blue" => "easy",
            "red" => "advanced",
            "black" => "expert",
            _ => "unknown",
        };

        return level;
    }

    // The sign that says how many runs are open.
    public static string OpenRunsSign(int open)
    {
        string sign = $"{open} {(open == 1 ? "run" : "runs")} open";

        return sign;
    }
}
