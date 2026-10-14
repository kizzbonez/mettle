// The example from the instructions.
List<Sale> sales =
[
    new Sale("Hill Farm", "apples", 6, 0.50m),
    new Sale("Brook Dairy", "cheese", 2, 4.50m),
    new Sale("Hill Farm", "pears", 10, 0.60m),
    new Sale("Old Mill", "bread", 3, 2.00m),
    new Sale("Hill Farm", "apples", 12, 0.50m),
];
List<Stall> stalls = [new Stall("Hill Farm", "Ashby"), new Stall("Brook Dairy", "Wenlow")];

var big = Market.BigSales(sales, 6m);
Check.SequenceEqual(big.Select(s => s.Product), new[] { "cheese", "apples", "bread", "pears" }, "the products of the sales of at least 6.00");
sales.Add(new Sale("Old Mill", "cake", 1, 12m));
Check.Equal(big.Count(), 5, "the big sales counted after a cake was sold");

Check.SequenceEqual(
    Market.QuantityByProduct(sales),
    new[] { ("apples", 18), ("bread", 3), ("cake", 1), ("cheese", 2), ("pears", 10) },
    "the quantity sold of each product");
Check.SequenceEqual(
    Market.Origins(sales, stalls),
    new[] { "apples from Ashby", "cheese from Wenlow", "pears from Ashby", "apples from Ashby" },
    "where each sold product was grown");
