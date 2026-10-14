// Setlist
//
// Four methods for a band's setlist app. Keep every signature exactly as it
// is: the tests call these methods by name, with these parameters.

static class Setlist
{
    // The length of the whole set in seconds.
    public static int TotalSeconds(int[] seconds)
    {
        int total = 0;
        foreach (int length in seconds)
        {
            total += length;
        }
        return total;
    }

    // The title of the longest song; seconds[i] is the length of titles[i].
    public static string Longest(string[] titles, int[] seconds)
    {
        int longest = 0;
        for (int i = 1; i < seconds.Length; i++)
        {
            if (seconds[i] > seconds[longest])
            {
                longest = i;
            }
        }
        return titles[longest];
    }

    // Removes every title that ends with " (cover)" from the list itself.
    public static void DropCovers(List<string> songs)
    {
        for (int i = songs.Count - 1; i >= 0; i--)
        {
            if (songs[i].EndsWith(" (cover)"))
            {
                songs.RemoveAt(i);
            }
        }
    }

    // A new list that starts with the opener; the list it receives stays as it was.
    public static List<string> WithOpener(List<string> songs, string opener)
    {
        List<string> result = new List<string>(songs);
        result.Remove(opener);
        result.Insert(0, opener);
        return result;
    }
}
