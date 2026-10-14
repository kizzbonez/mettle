static string Products(IEnumerable<Sale> sales) => string.Join(",", sales.Select(s => s.Product));

List<Sale> day =
[
    new Sale("A", "eggs", 12, 0.25m),      // 3.00
    new Sale("B", "honey", 1, 7.00m),      // 7.00
    new Sale("C", "jam", 2, 3.50m),        // 7.00
    new Sale("D", "cider", 4, 2.50m),      // 10.00
    new Sale("E", "beans", 5, 0.60m),      // 3.00
    new Sale("F", "flowers", 1, 7.00m),    // 7.00
];

Check.Equal(Products(Market.BigSales(day, 7m)), "cider,flowers,honey,jam", "a total equal to min counts, and equal totals are ordered by product");
Check.Equal(Products(Market.BigSales(day, 7.01m)), "cider", "a total just below min is left out");
Check.Equal(Products(Market.BigSales(day, 0m)), "cider,flowers,honey,jam,beans,eggs", "with a min of 0 every sale is listed, largest total first");
Check.Equal(Products(Market.BigSales(day, 100m)), "", "no sale reaches a min that is too high");
Check.Equal(Products(Market.BigSales(new List<Sale>(), 1m)), "", "a day without sales has no big sales");

// The total decides, not the quantity or the unit price.
List<Sale> mixed =
[
    new Sale("A", "plums", 20, 0.30m),     // 6.00
    new Sale("B", "melon", 1, 6.50m),      // 6.50
];
Check.Equal(Products(Market.BigSales(mixed, 6m)), "melon,plums", "sales are ordered by total, not by quantity");

// Sales with the same total and product keep the order they had.
List<Sale> twins =
[
    new Sale("First", "milk", 2, 1.00m),
    new Sale("Second", "milk", 1, 2.00m),
];
Check.SequenceEqual(Market.BigSales(twins, 1m).Select(s => s.Stall), new[] { "First", "Second" }, "sales with the same total and product keep their order");

// The result is a query: it reads the source when it runs.
var later = new List<Sale> { new Sale("A", "kale", 1, 1.00m) };
var query = Market.BigSales(later, 5m);
Check.Equal(query.Count(), 0, "no big sales yet");
later.Add(new Sale("B", "turkey", 1, 30m));
later.Add(new Sale("C", "goose", 1, 25m));
Check.Equal(Products(query), "turkey,goose", "sales added after the call are part of the result");
later.Clear();
Check.Equal(query.Count(), 0, "a cleared source gives no big sales");

// Nothing is read until the result is enumerated.
int reads = 0;
IEnumerable<Sale> watched = day.Select(sale => { reads++; return sale; });
var waiting = Market.BigSales(watched, 7m);
Check.Equal(reads, 0, "BigSales reads no sale before its result is enumerated");
Check.Equal(waiting.Count(), 4, "the big sales of the watched source");
Check.Equal(reads, day.Count, "enumerating once reads every sale once");
