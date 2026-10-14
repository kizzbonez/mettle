// Weigh-In Sheet
//
// One class that reads a fishing competition's weigh-in sheet. Keep every
// public name, parameter and type exactly as it is: the tests use them. You
// may add private fields and private methods.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

public class WeighIn
{
    // Suggested storage: the grams each angler has caught so far.
    private readonly Dictionary<string, int> _grams = new();

    // Reads a sheet, adds up the good lines, and returns one problem per bad line.
    public List<string> ReadSheet(string text)
    {
        throw new NotImplementedException();
    }

    // The angler's total in grams, or 0.
    public int TotalFor(string angler)
    {
        throw new NotImplementedException();
    }

    // The angler with the greatest total, the first alphabetically on a tie, or null.
    public string? Leader()
    {
        throw new NotImplementedException();
    }
}
