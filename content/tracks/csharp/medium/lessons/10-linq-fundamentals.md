---
title: LINQ Fundamentals
summary: Query in-memory data with LINQ in both method and query syntax, filter, project, sort, group and join sequences, and understand why a query does nothing until it is enumerated.
minutes: 30
objectives:
  - Write the same query in method syntax and in query syntax
  - Filter, project and sort with `Where`, `Select`, `OrderBy` and `ThenBy`
  - Group a sequence with `GroupBy` and combine two sequences with `Join`
  - Explain deferred execution and predict when a query's code runs
---

## Outline

1. What LINQ is
2. Method syntax and query syntax
3. Filtering, projecting and sorting
4. Grouping
5. Joining
6. Deferred execution

## What LINQ is

**LINQ** (Language-Integrated Query) is a set of methods, plus some C# syntax, for asking questions
of data: *which* orders are large, *grouped by* customer, *sorted by* total. Without it, each
question is a hand-written loop with temporary lists. With it, you describe the result and the
methods do the looping.

The methods, called the **standard query operators**, live in the `System.Linq` namespace (imported
by default in a console project) and work on any `IEnumerable<T>`: arrays, lists, sets, dictionaries
and your own sequences. They are extension methods, a feature lesson 13 explains; for now, they
simply appear as methods on every sequence. Almost all of them take lambdas (lesson 9).

The examples share this data:

```csharp
List<Order> orders =
[
    new Order(1, "ada", "pen", 10, 1.20m),
    new Order(2, "bo", "ink", 2, 7.50m),
    new Order(3, "ada", "pad", 3, 4.00m),
    new Order(4, "cy", "pen", 25, 1.20m),
    new Order(5, "bo", "pad", 1, 4.00m),
];

record Order(int Id, string Customer, string Product, int Quantity, decimal Price)
{
    public decimal Total => Quantity * Price;
}
```

## Method syntax and query syntax

A LINQ query can be written as a chain of method calls (**method syntax**) or with SQL-like
keywords (**query syntax**). The compiler turns query syntax into the same method calls, so the two
give identical results.

```csharp
IEnumerable<string> methodSyntax = orders
    .Where(o => o.Total >= 10m)
    .OrderByDescending(o => o.Total)
    .Select(o => $"#{o.Id} {o.Customer} {o.Total}");

IEnumerable<string> querySyntax =
    from o in orders
    where o.Total >= 10m
    orderby o.Total descending
    select $"#{o.Id} {o.Customer} {o.Total}";

Console.WriteLine(string.Join(" | ", methodSyntax));
Console.WriteLine(string.Join(" | ", querySyntax));
```

```text
#4 cy 30.00 | #2 bo 15.00 | #1 ada 12.00 | #3 ada 12.00
#4 cy 30.00 | #2 bo 15.00 | #1 ada 12.00 | #3 ada 12.00
```

A query expression starts with `from` and ends with `select` or `group`. Many operators, such as
`Count`, `Sum` and `First`, have no keyword and exist only as methods, so most C# code uses method
syntax and keeps query syntax for joins and groupings, where it reads more easily.

## Filtering, projecting and sorting

- **`Where(predicate)`** keeps the items for which the lambda returns `true`.
- **`Select(selector)`** transforms each item into something else. This is called **projection**:
  `Select(o => o.Product)` turns orders into product names.
- **`OrderBy(key)`** and **`OrderByDescending(key)`** sort by a key. **`ThenBy`** and
  **`ThenByDescending`** add a tie-breaker. Calling `OrderBy` twice does *not* do that: the second
  sort simply replaces the first.

LINQ's sorts are **stable**: items with equal keys keep their original order, which is why order 1
comes before order 3 above.

## Grouping

**`GroupBy(key)`** collects items that share a key. The result is a sequence of groups; each group
is an `IGrouping<TKey, TElement>`, which is itself a sequence of the items plus a `Key` property.

```csharp
var perCustomer = orders
    .GroupBy(o => o.Customer)
    .Select(g => new { Customer = g.Key, Count = g.Count(), Spent = g.Sum(o => o.Total) })
    .OrderByDescending(row => row.Spent)
    .ThenBy(row => row.Customer);

foreach (var row in perCustomer)
{
    Console.WriteLine($"{row.Customer}: {row.Count} orders, {row.Spent}");
}

var products = from o in orders
               group o.Product by o.Customer;
foreach (IGrouping<string, string> group in products)
{
    Console.WriteLine($"{group.Key}: {string.Join(",", group)}");
}
```

```text
cy: 1 orders, 30.00
ada: 2 orders, 24.00
bo: 2 orders, 19.00
ada: pen,pad
bo: ink,pad
cy: pen
```

`new { Customer = ..., Count = ..., Spent = ... }` creates an **anonymous type**: a small read-only
class that the compiler defines for you, with the properties you list. It has no name you can
write, so you hold it with `var`, and it is meant for intermediate results inside one method. A
record or a tuple serves when the result leaves the method. `Count` and `Sum` are aggregation
operators, the subject of the next lesson. Groups come out in the order their keys first appear.

## Joining

**`Join`** pairs items from two sequences whose keys match, like a database join. Each order is
paired with the customer whose `Name` equals the order's `Customer`. These lines continue the
program above with a second list:

```csharp
List<Customer> customers =
[
    new Customer("ada", "Lisbon"),
    new Customer("bo", "Oslo"),
    new Customer("dee", "Rome"),
];

var labels = orders.Join(customers,
    o => o.Customer,                  // key from each order
    c => c.Name,                      // key from each customer
    (o, c) => $"#{o.Id} {o.Product} to {c.City}");
Console.WriteLine(string.Join(" | ", labels));

var osloIds = from o in orders
              join c in customers on o.Customer equals c.Name
              where c.City == "Oslo"
              select o.Id;
Console.WriteLine(string.Join(",", osloIds));

record Customer(string Name, string City);
```

```text
#1 pen to Lisbon | #2 ink to Oslo | #3 pad to Lisbon | #5 pad to Oslo
2,5
```

`Join` is an **inner join**: an item with no partner is left out. Order 4 belongs to `cy`, who has
no customer record, and `dee` has no orders, so neither appears. In query syntax the keyword is
`equals`, not `==`, and the outer sequence's key must come first.

## Deferred execution

Building a query does not run it. A variable such as `methodSyntax` holds a *description* of the
work, and the work happens each time something enumerates it: a `foreach`, `string.Join`, or an
operator that needs a value, such as `Count` or `ToList`. This is **deferred execution**.

```csharp
var stock = new List<int> { 5, 0, 12 };
int checks = 0;

IEnumerable<int> outOfStock = stock.Where(n =>
{
    checks++;
    return n == 0;
});
Console.WriteLine($"defined: {checks} checks");

stock.Add(0);   // added after the query was written
Console.WriteLine($"found {outOfStock.Count()}, {checks} checks");

List<int> snapshot = outOfStock.ToList();   // runs it again and keeps the result
stock.Add(0);
Console.WriteLine($"snapshot {snapshot.Count}, live {outOfStock.Count()}, {checks} checks");
```

```text
defined: 0 checks
found 2, 4 checks
snapshot 2, live 3, 13 checks
```

The lambda had not run at all when the query was defined. `Count` ran it over four items,
including the one added afterwards, and `ToList` ran it again. The list it returned is a fixed
**snapshot**, while the query is **live** and sees every later change. Operators such as `Where`
and `Select` hand out results one at a time as the loop asks for them; `OrderBy` and `GroupBy`
must read the whole source before producing their first result.

## Common mistakes

- **Two `OrderBy` calls.** The second replaces the first. Use `ThenBy` for the tie-breaker.
- **Expecting a query to hold results.** It re-reads its source every time; call `ToList()` when you
  need a fixed copy.
- **Side effects in lambdas.** A lambda that changes state runs as often as the query is
  enumerated, which may be zero, once or many times.
- **`==` in a query `join`.** Query syntax requires `equals`.

## Practice

1. Write a query for the product names of orders with a quantity of at least 3, sorted
   alphabetically. Duplicates may stay.
2. Group the orders by product and print each product with its total quantity.
3. A query is defined, then the source list is cleared, then the query is enumerated. What does
   the loop see?

### Answers

1. `orders.Where(o => o.Quantity >= 3).Select(o => o.Product).OrderBy(p => p)` gives `pad`, `pen`,
   `pen`. Removing duplicates is `Distinct`, in the next lesson.
2. `orders.GroupBy(o => o.Product).Select(g => $"{g.Key}: {g.Sum(o => o.Quantity)}")` gives
   `pen: 35`, `ink: 2`, `pad: 4`.
3. Nothing. The query reads the source when it runs, and by then the list is empty.

## Key takeaways

- LINQ's standard query operators work on any `IEnumerable<T>`; query syntax compiles to the same
  method calls.
- `Where` filters, `Select` projects, `OrderBy` and `ThenBy` sort, `GroupBy` groups and `Join`
  pairs items with matching keys.
- A query is a recipe: it runs when enumerated, every time it is enumerated, and sees the data as
  it is at that moment.

## Further reading

- [Introduction to LINQ queries](https://learn.microsoft.com/en-us/dotnet/csharp/linq/get-started/introduction-to-linq-queries)
- [Write LINQ queries](https://learn.microsoft.com/en-us/dotnet/csharp/linq/get-started/write-linq-queries)
