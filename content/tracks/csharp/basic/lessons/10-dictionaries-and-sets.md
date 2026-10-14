---
title: Dictionaries and Sets
summary: Look values up by key with Dictionary<TKey, TValue>, read safely with TryGetValue, count things, keep unique values in a HashSet<T>, and choose the right collection for a job.
minutes: 30
objectives:
  - Create a dictionary, add, replace, read and remove entries, and explain what the indexer does for a missing key
  - Use `TryGetValue` and `GetValueOrDefault` to read without exceptions, and count occurrences with a dictionary
  - Use `HashSet<T>` to keep unique values and combine sets
  - Choose between an array, a list, a dictionary and a set for a given task
---

## Outline

1. Looking things up by key
2. Missing keys and duplicate keys
3. Reading safely with `TryGetValue`
4. Counting with a dictionary
5. Sets of unique values
6. Ignoring case in keys
7. Choosing a collection

## Looking things up by key

A list finds a value by its position. Often you want to find it by a *name* instead: the price
of a drink, the owner of a locker, the phone number of a person. A
**`Dictionary<TKey, TValue>`** stores **key/value pairs** and finds the value for a key almost
instantly, however many entries it holds. It has two type parameters: the type of the keys and
the type of the values.

```csharp
Dictionary<string, decimal> prices = new()
{
    ["espresso"] = 2.20m,
    ["latte"] = 3.10m,
};
prices["tea"] = 1.80m;
prices["latte"] = 3.30m;
Console.WriteLine($"{prices.Count} drinks, latte costs {prices["latte"]}");
Console.WriteLine(prices.ContainsKey("mocha"));
bool gone = prices.Remove("tea");
Console.WriteLine($"{gone} {prices.Count}");
foreach (KeyValuePair<string, decimal> pair in prices)
{
    Console.WriteLine($"{pair.Key}: {pair.Value}");
}
```

```text
3 drinks, latte costs 3.30
False
True 2
espresso: 2.20
latte: 3.30
```

- `new()` creates the dictionary. The type is taken from the declaration on the left, a form
  called *target-typed* `new`. The `["espresso"] = 2.20m` lines fill it in as it is created.
- `prices["tea"] = 1.80m` **adds** the key when it is missing and **replaces** the value when it
  exists, which is why `latte` now costs 3.30 and there are still only three entries.
- `ContainsKey` tests for a key, and `Remove` returns `false` when there was nothing to remove.
- `foreach` visits every entry as a `KeyValuePair` with `Key` and `Value` properties. `var pair`
  works too.
- `Keys` and `Values` give the keys or the values alone.

A dictionary does not promise any order when you loop over it. If the output must be in a
particular order, sort the keys first.

## Missing keys and duplicate keys

Reading a key that is not there throws:

```csharp
Dictionary<string, decimal> prices = new() { ["espresso"] = 2.20m };
Console.WriteLine(prices["mocha"]);
```

```text
Unhandled exception. System.Collections.Generic.KeyNotFoundException: The given key 'mocha' was not present in the dictionary.
   at System.Collections.Generic.Dictionary`2.get_Item(TKey key)
   at Program.<Main>$(String[] args) in /home/ada/cafe/Program.cs:line 2
```

Every key is unique. The `Add(key, value)` method, unlike the indexer, refuses to replace:
`prices.Add("espresso", 2.50m)` on the dictionary above throws an `ArgumentException`, "An item
with the same key has already been added. Key: espresso". Use `Add` when a duplicate would be a
bug, and the indexer when replacing is what you want. A key may not be `null`.

## Reading safely with `TryGetValue`

`TryGetValue` follows the same pattern as `int.TryParse`: it returns whether the key was found,
and hands the value back through an `out` variable:

```csharp
Dictionary<string, decimal> prices = new() { ["espresso"] = 2.20m, ["latte"] = 3.10m };
string[] order = ["latte", "mocha", "espresso"];
foreach (string item in order)
{
    if (prices.TryGetValue(item, out decimal price))
    {
        Console.WriteLine($"{item}: {price}");
    }
    else
    {
        Console.WriteLine($"{item}: not on the menu");
    }
}
```

```text
latte: 3.10
mocha: not on the menu
espresso: 2.20
```

It looks the key up once, where `ContainsKey` followed by the indexer looks it up twice. When a
missing key simply means "use the default", `prices.GetValueOrDefault("mocha")` returns 0 for
numbers, or the value you pass as a second argument.

## Counting with a dictionary

Counting how often each value occurs is one of the commonest jobs for a dictionary: the thing
being counted is the key, and the count is the value.

```csharp
string[] sales = ["latte", "tea", "latte", "espresso", "latte", "tea"];
Dictionary<string, int> counts = new();
foreach (string drink in sales)
{
    if (counts.TryGetValue(drink, out int count))
    {
        counts[drink] = count + 1;
    }
    else
    {
        counts[drink] = 1;
    }
}
List<string> names = new List<string>(counts.Keys);
names.Sort();
foreach (string name in names)
{
    Console.WriteLine($"{name,-9}{counts[name]}");
}
```

```text
espresso 1
latte    3
tea      2
```

The `if` can be shortened to `counts[drink] = counts.GetValueOrDefault(drink) + 1;`, because a
missing key gives 0. Copying the keys into a list and sorting it gives a predictable order.

## Sets of unique values

A **`HashSet<T>`** holds values without duplicates and without any order. Its job is to answer
"have I seen this?" quickly:

```csharp
HashSet<string> visitors = [];
Console.WriteLine(visitors.Add("ana"));
Console.WriteLine(visitors.Add("ben"));
Console.WriteLine(visitors.Add("ana"));
Console.WriteLine($"{visitors.Count} {visitors.Contains("ben")}");
HashSet<string> monday = ["ana", "ben", "cara"];
HashSet<string> tuesday = ["ben", "dev"];
HashSet<string> both = new HashSet<string>(monday);
both.IntersectWith(tuesday);
Console.WriteLine(string.Join(",", both));
monday.UnionWith(tuesday);
Console.WriteLine(monday.Count);
```

```text
True
True
False
2 True
ben
4
```

`Add` returns `false` when the value was already present, which makes "is this new?" a single
call. `IntersectWith` keeps only the values in both sets, `UnionWith` adds the other set's values
and `ExceptWith` removes them. These methods change the set they are called on, which is why
`both` starts as a copy of `monday`. Checking `Contains` on a list compares the value with every
element in turn. On a set it takes about the same time for ten values or ten million.

## Ignoring case in keys

Keys are compared exactly by default, so `"Oat Milk"` and `"oat milk"` are different keys. Pass
a **comparer** when the collection is created to change that:

```csharp
Dictionary<string, int> stock = new(StringComparer.OrdinalIgnoreCase);
stock["Oat Milk"] = 4;
Console.WriteLine(stock["oat milk"]);
HashSet<string> tags = new(StringComparer.OrdinalIgnoreCase) { "Vegan" };
Console.WriteLine(tags.Contains("VEGAN"));
```

```text
4
True
```

## Choosing a collection

| You need | Use |
| --- | --- |
| a fixed number of values in order | an array |
| values in order, adding and removing | `List<T>` |
| a value for each key | `Dictionary<TKey, TValue>` |
| to know quickly whether a value is present, without duplicates | `HashSet<T>` |

Do not add keys to a dictionary or set while a `foreach` loop is going over it. Collect the
changes in a list and apply them after the loop.

## Common mistakes

- **Reading `dict[key]` for a key that may be missing.** Use `TryGetValue` or
  `GetValueOrDefault`.
- **Using `Add` to update.** It throws for an existing key. Assign with the indexer.
- **Relying on the order of a dictionary or set.** Sort the keys when order matters.
- **Searching a large list with `Contains` again and again.** Put the values in a `HashSet<T>`.
- **Keys that differ only in case** when they should be equal: pass
  `StringComparer.OrdinalIgnoreCase`.

## Practice

1. Count the letters in `"the cat and the hat"`, ignoring spaces, and print the counts for `t`
   and `h`. Use a `Dictionary<char, int>`.
2. Several lines like `"ana:latte"` record orders. Build a `Dictionary<string, List<string>>`
   from each customer to the items they ordered, and print what `ana` ordered for
   `["ana:latte", "ben:tea", "ana:scone"]`.
3. Which collection fits each task: the unique ids of visitors today, the songs of a playlist in
   order, the phone number for each name?

### Answers

```csharp
Dictionary<char, int> letters = new();
foreach (char c in "the cat and the hat")
{
    if (c != ' ')
    {
        letters[c] = letters.GetValueOrDefault(c) + 1;
    }
}
Console.WriteLine($"t={letters['t']} h={letters['h']}");

Dictionary<string, List<string>> orders = new();
string[] lines = ["ana:latte", "ben:tea", "ana:scone"];
foreach (string line in lines)
{
    string[] parts = line.Split(':');
    if (!orders.ContainsKey(parts[0]))
    {
        orders[parts[0]] = [];
    }
    orders[parts[0]].Add(parts[1]);
}
Console.WriteLine(string.Join(", ", orders["ana"]));
```

```text
t=4 h=3
latte, scone
```

**2.** The first time a customer appears, an empty list is stored for them. After that,
`orders[parts[0]]` returns the same list, and `Add` extends it.
**3.** A `HashSet<string>` for unique ids, a `List<string>` for the playlist, and a
`Dictionary<string, string>` from name to number.

## Key takeaways

- A dictionary maps unique keys to values. The indexer adds or replaces, and throws
  `KeyNotFoundException` when reading a missing key.
- `TryGetValue` and `GetValueOrDefault` read without exceptions. Counting is "key is the thing,
  value is the count".
- `HashSet<T>` keeps unique values, and `Add` tells you whether a value was new.
- Neither dictionaries nor sets keep an order. Sort when the order matters.

## Further reading

- [Microsoft Learn: The generic Dictionary class](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.dictionary-2)
- [Microsoft Learn: The generic HashSet class](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.hashset-1)
- [Microsoft Learn: Selecting a collection class](https://learn.microsoft.com/en-us/dotnet/standard/collections/selecting-a-collection-class)
