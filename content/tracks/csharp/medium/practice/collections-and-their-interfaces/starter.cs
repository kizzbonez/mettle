// Restaurant Kitchen
//
// A queue for orders in arrival order, a read-only view of what was served,
// and a sorted tally that accepts any sequence and ignores case.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// <summary>The orders of one evening in the kitchen.</summary>
public class Kitchen
{
    // TODO: choose a collection for the orders that wait, and one for the dishes served.

    /// <summary>The number of orders not yet cooked.</summary>
    public int Waiting => throw new NotImplementedException();

    /// <summary>The order that has waited longest, or null; it stays waiting.</summary>
    public string? NextUp => throw new NotImplementedException();

    /// <summary>The dishes cooked so far, in order, as a view callers cannot change.</summary>
    public IReadOnlyList<string> Served => throw new NotImplementedException();

    /// <summary>Adds an order at the back.</summary>
    public void Order(string dish)
    {
        throw new NotImplementedException();
    }

    /// <summary>Cooks the order that has waited longest and returns it, or null.</summary>
    public string? Cook()
    {
        throw new NotImplementedException();
    }
}

public static class Menu
{
    /// <summary>How often each dish appears, keys in alphabetical order, case ignored.</summary>
    public static IReadOnlyDictionary<string, int> Tally(IEnumerable<string> dishes)
    {
        throw new NotImplementedException();
    }
}
