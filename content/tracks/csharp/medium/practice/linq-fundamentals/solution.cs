// Farmers' Market
//
// Three LINQ queries over the sales of a market day: filter and sort with a
// tie-breaker, group and project, and join two sequences.

/// <summary>One sale at a stall.</summary>
public record Sale(string Stall, string Product, int Quantity, decimal UnitPrice)
{
    public decimal Total => Quantity * UnitPrice;
}

/// <summary>A stall and the village its farm is in.</summary>
public record Stall(string Name, string Village);

public static class Market
{
    /// <summary>Sales with a total of at least min, largest first, ties by product. Deferred.</summary>
    public static IEnumerable<Sale> BigSales(IEnumerable<Sale> sales, decimal min) =>
        sales
            .Where(sale => sale.Total >= min)
            .OrderByDescending(sale => sale.Total)
            .ThenBy(sale => sale.Product);   // ThenBy breaks ties; a second OrderBy would replace the first

    /// <summary>The quantity sold of each product, products in alphabetical order.</summary>
    public static IEnumerable<(string Product, int Quantity)> QuantityByProduct(IEnumerable<Sale> sales) =>
        sales
            .GroupBy(sale => sale.Product)
            .Select(group => (Product: group.Key, Quantity: group.Sum(sale => sale.Quantity)))
            .OrderBy(row => row.Product);

    /// <summary>"product from village" for each sale whose stall is known, in sale order.</summary>
    public static IEnumerable<string> Origins(IEnumerable<Sale> sales, IEnumerable<Stall> stalls) =>
        from sale in sales
        join stall in stalls on sale.Stall equals stall.Name
        select $"{sale.Product} from {stall.Village}";
}
