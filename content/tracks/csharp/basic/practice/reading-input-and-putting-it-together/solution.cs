// Weigh-In Sheet
//
// One class that reads a fishing competition's weigh-in sheet. Keep every
// public name, parameter and type exactly as it is: the tests use them. You
// may add private fields and private methods.

public class WeighIn
{
    // Suggested storage: the grams each angler has caught so far.
    private readonly Dictionary<string, int> _grams = new();

    // Reads a sheet, adds up the good lines, and returns one problem per bad line.
    public List<string> ReadSheet(string text)
    {
        var problems = new List<string>();
        string[] lines = text.Split('\n');
        for (int i = 0; i < lines.Length; i++)
        {
            string line = lines[i].Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }
            string[] fields = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (fields.Length != 2)
            {
                problems.Add($"line {i + 1}: expected a name and a weight");
            }
            else if (!int.TryParse(fields[1], out int grams) || grams < 1)
            {
                problems.Add($"line {i + 1}: '{fields[1]}' is not a weight");
            }
            else
            {
                _grams[fields[0]] = _grams.GetValueOrDefault(fields[0]) + grams;
            }
        }
        return problems;
    }

    // The angler's total in grams, or 0.
    public int TotalFor(string angler) => _grams.GetValueOrDefault(angler);

    // The angler with the greatest total, the first alphabetically on a tie, or null.
    public string? Leader()
    {
        var names = new List<string>(_grams.Keys);
        names.Sort();
        string? leader = null;
        foreach (string name in names)
        {
            if (leader is null || _grams[name] > _grams[leader])
            {
                leader = name;
            }
        }
        return leader;
    }
}
