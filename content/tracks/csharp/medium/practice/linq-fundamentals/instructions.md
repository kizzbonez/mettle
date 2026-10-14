The records `Sale` and `Stall` are complete: do not change them. A sale's `Total` is its
quantity times its unit price. Write the three methods of `Market` as LINQ queries, in method
syntax or query syntax. Product names are in lower case.

1. **`BigSales(IEnumerable<Sale> sales, decimal min)`** returns the sales whose `Total` is at
   least `min`, the largest total first. Sales with equal totals are ordered by `Product`.
   Return the query itself, not a list: nothing is read until the result is enumerated, and a
   sale added to the source afterwards is part of the result.
2. **`QuantityByProduct(IEnumerable<Sale> sales)`** returns one `(string Product, int Quantity)`
   per product: the quantity sold across all its sales. Products come in alphabetical order.
3. **`Origins(IEnumerable<Sale> sales, IEnumerable<Stall> stalls)`** pairs each sale with the
   stall of the same name and returns `"<product> from <village>"`, in the order of the sales.
   A sale whose stall is not in `stalls` is left out.

Example:

```csharp
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
big.Select(s => s.Product)         // cheese, apples, bread, pears: 9.00 first, then three of 6.00
sales.Add(new Sale("Old Mill", "cake", 1, 12m));
big.Count()                        // 5: the query reads the list when it runs

Market.QuantityByProduct(sales)    // (apples, 18), (bread, 3), (cake, 1), (cheese, 2), (pears, 10)
Market.Origins(sales, stalls)      // apples from Ashby, cheese from Wenlow, pears from Ashby,
                                   // apples from Ashby: the Old Mill has no stall record
```
