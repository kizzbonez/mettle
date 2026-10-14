// Sports Day
//
// Four methods for the teachers' laptop. Keep every signature exactly as it
// is: the tests call these methods by name, with these parameters.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

static class SportsDay
{
    // How many races each house won.
    public static Dictionary<string, int> Wins(string[] winners)
    {
        throw new NotImplementedException();
    }

    // 3 points per race won, and 0 for a house that is not in the dictionary.
    public static int Points(Dictionary<string, int> wins, string house)
    {
        throw new NotImplementedException();
    }

    // How many different children signed up, ignoring upper and lower case.
    public static int Athletes(string[] signUps)
    {
        throw new NotImplementedException();
    }

    // The names in both races, each once, sorted alphabetically.
    public static List<string> InBoth(string[] sprint, string[] relay)
    {
        throw new NotImplementedException();
    }
}
