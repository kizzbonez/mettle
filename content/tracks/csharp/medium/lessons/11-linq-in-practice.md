---
title: LINQ in Practice
summary: Summarise sequences with aggregation operators, build dictionaries and lookups, pick single elements safely, test sequences with `Any` and `All`, and avoid the hidden cost of enumerating a query twice.
minutes: 30
objectives:
  - Compute counts, sums, averages, minimums and maximums, and predict what each does on an empty sequence
  - Build a `Dictionary` with `ToDictionary` and an `ILookup` with `ToLookup`, and explain how they treat duplicate and missing keys
  - Choose between `First`, `FirstOrDefault` and `Single`, and between `Any`, `All` and `Count`
  - Spot code that enumerates a deferred query more than once and fix it with `ToList`
---

## Outline

1. Aggregation
2. Dictionaries and lookups
3. Removing duplicates
4. Picking one element
5. `Any` and `All`
6. The cost of enumerating twice

## Aggregation

An **aggregation** operator reduces a whole sequence to one value. Unlike `Where` and `Select`,
it runs **immediately**: it has to read the items to produce its answer.

```csharp
decimal[] sales = [120m, 80m, 45.5m, 200m];
Console.WriteLine($"{sales.Count()} {sales.Sum()} {sales.Min()} {sales.Max()} {sales.Average()}");
Console.WriteLine(sales.Count(s => s >= 100m));

string[] words = ["fig", "banana", "kiwi"];
Console.WriteLine($"{words.Max(w => w.Length)} {words.MaxBy(w => w.Length)}");
Console.WriteLine(words.Aggregate((joined, next) => joined + "+" + next));

decimal[] none = [];
Console.WriteLine(none.Sum());
try
{
    Console.WriteLine(none.Average());
}
catch (InvalidOperationException e)
{
    Console.WriteLine(e.Message);
}
```

```text
4 445.5 45.5 200 111.375
2
6 banana
fig+banana+kiwi
0
Sequence contains no elements
```

- `Count`, `Sum`, `Min`, `Max` and `Average` accept an optional lambda: `Count(s => s >= 100m)`
  counts matches, `Max(w => w.Length)` gives the largest length.
- `MaxBy` and `MinBy` return the *item* with the largest or smallest key, not the key itself.
- `Aggregate` is the general form: it combines the items pairwise with your lambda.
- On an empty sequence, `Sum` and `Count` give 0, but `Average`, `Min` and `Max` of numbers throw
  `InvalidOperationException`, because there is no meaningful answer. Check with `Any()` first, or
  decide what an empty input should mean.

## Dictionaries and lookups

`ToDictionary(keySelector)` reads the sequence and builds a `Dictionary` for fast lookups by key.
`ToLookup(keySelector)` builds an `ILookup<TKey, TElement>`, which is like a read-only dictionary
whose values are *sequences*: one key, many items. `CountBy` (.NET 9 and later) counts the items
per key without building groups.

```csharp
Book[] books =
[
    new Book("111", "Dune", "Herbert"),
    new Book("222", "Emma", "Austen"),
    new Book("333", "Persuasion", "Austen"),
];

Dictionary<string, Book> byIsbn = books.ToDictionary(b => b.Isbn);
Console.WriteLine(byIsbn["222"].Title);

ILookup<string, string> titlesByAuthor = books.ToLookup(b => b.Author, b => b.Title);
Console.WriteLine(string.Join(", ", titlesByAuthor["Austen"]));
Console.WriteLine(titlesByAuthor["Tolkien"].Count());   // a missing key gives an empty sequence

foreach (var (author, count) in books.CountBy(b => b.Author))
{
    Console.Write($"{author}={count} ");
}
Console.WriteLine();

try
{
    var byAuthor = books.ToDictionary(b => b.Author);
}
catch (ArgumentException e)
{
    Console.WriteLine(e.Message);
}

record Book(string Isbn, string Title, string Author);
```

```text
Emma
Emma, Persuasion
0
Herbert=1 Austen=2 
An item with the same key has already been added. Key: Austen
```

A dictionary's keys must be unique, so `ToDictionary` throws `ArgumentException` on the second
`Austen`. Use it only when the key really is unique, such as an ISBN; group with `ToLookup` or
`GroupBy` otherwise. A lookup also answers a missing key with an empty sequence, where a
dictionary's indexer throws `KeyNotFoundException`. Unlike `GroupBy`, both run immediately and
keep their results.

## Removing duplicates

`Distinct()` keeps the first occurrence of each value, using the type's equality (lesson 2), so
records and types that implement `IEquatable<T>` work as expected. `DistinctBy(keySelector)` keeps
the first item for each key, for example one book per author with `books.DistinctBy(b => b.Author)`.

## Picking one element

```csharp
int[] codes = [3, 7, 3, 9, 7, 1];
Console.WriteLine(string.Join(",", codes.Distinct()));

Console.WriteLine(Try(() => codes.First(c => c > 5)));
Console.WriteLine(Try(() => codes.First(c => c > 50)));
Console.WriteLine(Try(() => codes.FirstOrDefault(c => c > 50)));       // default(int) is 0
Console.WriteLine(Try(() => codes.FirstOrDefault(c => c > 50, -1)));   // your own fallback
Console.WriteLine(Try(() => codes.Single(c => c == 9)));
Console.WriteLine(Try(() => codes.Single(c => c == 3)));

int[] empty = [];
Console.WriteLine($"{codes.Any(c => c > 8)} {codes.All(c => c > 0)} {empty.Any()} {empty.All(c => c > 100)}");

static string Try(Func<int> query)
{
    try
    {
        return query().ToString();
    }
    catch (InvalidOperationException e)
    {
        return e.Message;
    }
}
```

```text
3,7,9,1
7
Sequence contains no matching element
0
-1
9
Sequence contains more than one matching element
True True False True
```

- **`First`** returns the first match and throws if there is none. Use it when "none" would be a
  bug.
- **`FirstOrDefault`** returns `default(T)` when there is no match: `null` for a class, but `0`
  for an `int`, which cannot be told apart from a real 0. Pass your own fallback, as with `-1`
  above, when that matters.
- **`Single`** insists on exactly one match and throws for none *or* several. Use it when
  duplicates would mean corrupt data. `Last`, `LastOrDefault` and `SingleOrDefault` follow the
  same rules.

## `Any` and `All`

`Any()` asks "is there at least one?" and `Any(predicate)` "does at least one match?". Both stop at
the first match, so prefer `Any()` to `Count() > 0`, which may read everything. `All(predicate)`
asks "does every item match?" and stops at the first failure. On an empty sequence `All` is
`True`, because no item fails the test. This is called being *vacuously* true, and it surprises
people: check `Any()` as well if "all of nothing" should count as a no.

## The cost of enumerating twice

The previous lesson showed that a query runs every time it is enumerated. Each of `Any`, `Count`,
`First` and `foreach` is a separate enumeration, so innocent-looking code can run a query many
times:

```csharp
int checks = 0;
int[] daysLate = [3, 40, 12, 65];
IEnumerable<int> overdue = daysLate.Where(d =>
{
    checks++;   // imagine a slow database call here
    return d > 30;
});

if (overdue.Any())
{
    Console.WriteLine($"{overdue.Count()} overdue: {string.Join(",", overdue)}");
}
Console.WriteLine($"checks: {checks}");

checks = 0;
List<int> list = overdue.ToList();   // enumerate once, then reuse the list
if (list.Count > 0)
{
    Console.WriteLine($"{list.Count} overdue: {string.Join(",", list)}");
}
Console.WriteLine($"checks: {checks}");
```

```text
2 overdue: 40,65
checks: 10
2 overdue: 40,65
checks: 4
```

`Any` ran the filter twice (it stopped at 40), `Count` four times and `Join` four more. With
`ToList`, the filter runs once per item and the list answers the rest. When the source is a file,
a network stream or a database, repeated enumeration repeats the I/O, may return different data
each time, and some sources cannot be read twice at all. The code-analysis rule CA1851 can warn
about it. If you need a sequence more than once, **materialize** it with `ToList` or `ToArray`.

## Common mistakes

- **`FirstOrDefault` on value types.** A result of `0` may be a real item or "not found".
- **`Count() > 0` instead of `Any()`.** It can read the whole sequence to answer a yes-or-no
  question.
- **`ToDictionary` on a non-unique key.** It throws on the first duplicate.
- **`Average` on possibly empty input.** It throws; decide what empty should mean.

## Practice

1. From `int[] temps = [12, -3, 7, 0];` compute the number of freezing days (at or below 0) and
   the warmest temperature.
2. Should a lookup of a user by unique email use `First`, `FirstOrDefault` or `Single`?
3. What does `new string[0].All(s => s.Length > 3)` return, and why?

### Answers

1. `temps.Count(t => t <= 0)` gives 2 and `temps.Max()` gives 12.
2. `SingleOrDefault` if a missing user is normal, `Single` if not: both throw when two users share
   an email, exposing the broken data instead of silently picking one.
3. `True`. `All` is true when no item fails the test, and an empty sequence has no items to fail.

## Key takeaways

- Aggregates and `To...` methods run immediately; `Average`, `Min` and `Max` throw on empty input.
- `ToDictionary` needs unique keys; `ToLookup` groups many items per key and tolerates missing keys.
- `First` throws when nothing matches, `FirstOrDefault` returns a default, `Single` demands exactly
  one.
- Every enumeration reruns a deferred query; materialize with `ToList` when you need it twice.

## Further reading

- [Introduction to LINQ queries: classification by manner of execution](https://learn.microsoft.com/en-us/dotnet/csharp/linq/get-started/introduction-to-linq-queries)
- [CA1851: Possible multiple enumerations of IEnumerable collection](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca1851)
- [Enumerable.CountBy method](https://learn.microsoft.com/en-us/dotnet/api/system.linq.enumerable.countby)
