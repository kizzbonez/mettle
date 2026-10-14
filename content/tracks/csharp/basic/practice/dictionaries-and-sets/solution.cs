// Sports Day
//
// Four methods for the teachers' laptop. Keep every signature exactly as it
// is: the tests call these methods by name, with these parameters.

static class SportsDay
{
    // How many races each house won.
    public static Dictionary<string, int> Wins(string[] winners)
    {
        Dictionary<string, int> wins = new();
        foreach (string house in winners)
        {
            wins[house] = wins.GetValueOrDefault(house) + 1;
        }
        return wins;
    }

    // 3 points per race won, and 0 for a house that is not in the dictionary.
    public static int Points(Dictionary<string, int> wins, string house)
    {
        if (wins.TryGetValue(house, out int count))
        {
            return count * 3;
        }
        return 0;
    }

    // How many different children signed up, ignoring upper and lower case.
    public static int Athletes(string[] signUps)
    {
        HashSet<string> children = new(StringComparer.OrdinalIgnoreCase);
        foreach (string name in signUps)
        {
            children.Add(name);
        }
        return children.Count;
    }

    // The names in both races, each once, sorted alphabetically.
    public static List<string> InBoth(string[] sprint, string[] relay)
    {
        HashSet<string> both = new HashSet<string>(sprint);
        both.IntersectWith(relay);
        List<string> names = new List<string>(both);
        names.Sort();
        return names;
    }
}
