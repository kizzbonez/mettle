// Farmers' Market
//
// Three LINQ queries over the sales of a market day: filter and sort with a
// tie-breaker, group and project, and join two sequences.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// <summary>One sale at a stall. Complete: do not change it.</summary>
public record Sale(string Stall, string Product, int Quantity, decimal UnitPrice)
{
    public decimal Total => Quantity * UnitPrice;
}

/// <summary>A stall and the village its farm is in. Complete: do not change it.</summary>
public record Stall(string Name, string Village);

public static class Market
{
    /// <summary>Sales with a total of at least min, largest first, ties by product. Deferred.</summary>
    public static IEnumerable<Sale> BigSales(IEnumerable<Sale> sales, decimal min)
    {
        throw new NotImplementedException();
    }

    /// <summary>The quantity sold of each product, products in alphabetical order.</summary>
    public static IEnumerable<(string Product, int Quantity)> QuantityByProduct(IEnumerable<Sale> sales)
    {
        throw new NotImplementedException();
    }

    /// <summary>"product from village" for each sale whose stall is known, in sale order.</summary>
    public static IEnumerable<string> Origins(IEnumerable<Sale> sales, IEnumerable<Stall> stalls)
    {
        throw new NotImplementedException();
    }
}
