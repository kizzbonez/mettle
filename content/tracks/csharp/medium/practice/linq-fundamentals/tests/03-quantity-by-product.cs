Check.SequenceEqual(Market.QuantityByProduct(new List<Sale>()), new (string, int)[0], "no sales give no products");
Check.SequenceEqual(
    Market.QuantityByProduct([new Sale("A", "leeks", 4, 0.40m)]),
    new[] { ("leeks", 4) },
    "one sale gives one product with its quantity");

List<Sale> day =
[
    new Sale("A", "tomatoes", 5, 0.30m),
    new Sale("B", "basil", 1, 1.50m),
    new Sale("C", "tomatoes", 8, 0.35m),
    new Sale("A", "onions", 3, 0.20m),
    new Sale("D", "basil", 2, 1.40m),
    new Sale("A", "tomatoes", 1, 0.30m),
    new Sale("E", "zucchini", 2, 0.90m),
];
var rows = Market.QuantityByProduct(day).ToList();
Check.SequenceEqual(
    rows,
    new[] { ("basil", 3), ("onions", 3), ("tomatoes", 14), ("zucchini", 2) },
    "quantities added up per product, products in alphabetical order");
Check.Equal(rows[2].Product, "tomatoes", "the element named Product");
Check.Equal(rows[2].Quantity, 14, "the element named Quantity adds the quantities, not the number of sales");

// The stall and the price play no part.
List<Sale> sameProduct =
[
    new Sale("A", "figs", 2, 1.00m),
    new Sale("B", "figs", 3, 9.00m),
];
Check.SequenceEqual(Market.QuantityByProduct(sameProduct), new[] { ("figs", 5) }, "sales of one product at two stalls and two prices");
