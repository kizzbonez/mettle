// Setlist
//
// Four methods for a band's setlist app. Keep every signature exactly as it
// is: the tests call these methods by name, with these parameters.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

static class Setlist
{
    // The length of the whole set in seconds.
    public static int TotalSeconds(int[] seconds)
    {
        throw new NotImplementedException();
    }

    // The title of the longest song; seconds[i] is the length of titles[i].
    public static string Longest(string[] titles, int[] seconds)
    {
        throw new NotImplementedException();
    }

    // Removes every title that ends with " (cover)" from the list itself.
    public static void DropCovers(List<string> songs)
    {
        throw new NotImplementedException();
    }

    // A new list that starts with the opener; the list it receives stays as it was.
    public static List<string> WithOpener(List<string> songs, string opener)
    {
        throw new NotImplementedException();
    }
}
