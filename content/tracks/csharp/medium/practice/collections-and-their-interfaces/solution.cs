// Restaurant Kitchen
//
// A queue for orders in arrival order, a read-only view of what was served,
// and a sorted tally that accepts any sequence and ignores case.

/// <summary>The orders of one evening in the kitchen.</summary>
public class Kitchen
{
    private readonly Queue<string> waiting = new();   // first in, first out
    private readonly List<string> served = new();

    /// <summary>The number of orders not yet cooked.</summary>
    public int Waiting => waiting.Count;

    /// <summary>The order that has waited longest, or null; it stays waiting.</summary>
    public string? NextUp => waiting.TryPeek(out var dish) ? dish : null;

    /// <summary>The dishes cooked so far, in order, as a view callers cannot change.</summary>
    public IReadOnlyList<string> Served => served.AsReadOnly();   // a wrapper that reads through

    /// <summary>Adds an order at the back.</summary>
    public void Order(string dish) => waiting.Enqueue(dish);

    /// <summary>Cooks the order that has waited longest and returns it, or null.</summary>
    public string? Cook()
    {
        if (!waiting.TryDequeue(out var dish)) return null;
        served.Add(dish);
        return dish;
    }
}

public static class Menu
{
    /// <summary>How often each dish appears, keys in alphabetical order, case ignored.</summary>
    public static IReadOnlyDictionary<string, int> Tally(IEnumerable<string> dishes)
    {
        // The comparer decides both equality and order for the sorted dictionary.
        var counts = new SortedDictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (string dish in dishes)
        {
            counts.TryGetValue(dish, out int count);
            counts[dish] = count + 1;
        }
        return counts;
    }
}
