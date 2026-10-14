---
title: Collections and Their Interfaces
summary: Learn the interfaces every .NET collection implements, use them to accept and return collections safely, and add queues, stacks and sorted collections to your toolkit.
minutes: 30
objectives:
  - Describe what `IEnumerable<T>`, `ICollection<T>`, `IList<T>` and the read-only interfaces each add
  - Choose parameter and return types so that methods accept any suitable collection and callers cannot corrupt internal state
  - Use `Queue<T>`, `Stack<T>`, `SortedDictionary<TKey, TValue>` and `SortedSet<T>` for the jobs they fit
  - Pick a collection for a task from its access pattern and the cost of its operations
---

## Outline

1. One family of interfaces
2. Accept little, return safely
3. `Queue<T>` and `Stack<T>`
4. Sorted collections
5. Choosing a collection

## One family of interfaces

The Basic level used arrays, `List<T>`, `Dictionary<TKey, TValue>` and `HashSet<T>`. Each of them
implements a set of interfaces from `System.Collections.Generic` (lesson 4), and those interfaces
are what let one method work with all of them. The ones you meet most often:

- **`IEnumerable<T>`**: the items can be visited one after another, which is all `foreach` and LINQ
  need. Every collection implements it.
- **`IReadOnlyCollection<T>`** adds `Count`. **`IReadOnlyList<T>`** also adds a read-only indexer.
- **`ICollection<T>`** adds `Count`, `Add`, `Remove`, `Clear` and `Contains`.
- **`IList<T>`** adds a read-write indexer, `Insert`, `RemoveAt` and `IndexOf`.
- **`IDictionary<TKey, TValue>`** and **`IReadOnlyDictionary<TKey, TValue>`** describe maps, and
  **`ISet<T>`** describes sets.

All of them extend `IEnumerable<T>`. `List<T>` implements both `IList<T>` and `IReadOnlyList<T>`.

## Accept little, return safely

A parameter should ask for the *least* capable interface that still does the job, so that callers
can pass whatever they have. A return type should give the caller only the abilities you intend.

```csharp
int[] array = [4, 8, 15];
List<int> list = [16, 23];
HashSet<int> set = [42, 4];
Console.WriteLine($"{Total(array)} {Total(list)} {Total(set)}");

var shelf = new Shelf();
shelf.Add("Dune");
IReadOnlyList<string> view = shelf.Titles;
Console.WriteLine($"{view.Count} {view[0]} {view.GetType().Name}");

ICollection<int> fixedSize = array;   // arrays implement ICollection<T> and IList<T>
try
{
    fixedSize.Add(16);
}
catch (NotSupportedException e)
{
    Console.WriteLine(e.Message);
}

static int Total(IEnumerable<int> numbers)   // accepts any sequence of ints
{
    int sum = 0;
    foreach (int n in numbers) sum += n;
    return sum;
}

class Shelf
{
    private readonly List<string> titles = new();
    public IReadOnlyList<string> Titles => titles.AsReadOnly();
    public void Add(string title) => titles.Add(title);
}
```

```text
27 39 46
1 Dune ReadOnlyCollection`1
Collection was of a fixed size.
```

- `Total` takes `IEnumerable<int>`, so an array, a list and a set all work. Had it taken
  `List<int>`, the other two would need converting first.
- `Titles` returns `titles.AsReadOnly()`, a `ReadOnlyCollection<T>` **wrapper**: a separate object
  that reads through to the list but has no way to change it. Returning the `List<T>` itself as an
  `IReadOnlyList<T>` would be weaker, because a caller could cast it back to `List<string>` and
  add to it. The wrapper also stays current: titles added later appear in it.
- An interface does not guarantee every operation works. An array is an `ICollection<T>`, but its
  size is fixed, so `Add` throws `NotSupportedException`. `IsReadOnly` tells you in advance.

## `Queue<T>` and `Stack<T>`

Some jobs need items in a particular order of arrival, not by position.

- A **queue** is first in, first out (FIFO), like people at a counter. `Enqueue` adds at the back,
  `Dequeue` removes from the front and `Peek` looks at the front without removing it.
- A **stack** is last in, first out (LIFO), like a pile of plates. `Push` adds on top, `Pop`
  removes the top item and `Peek` looks at it.

```csharp
var printQueue = new Queue<string>();
printQueue.Enqueue("invoice.pdf");
printQueue.Enqueue("label.png");
printQueue.Enqueue("report.docx");
Console.WriteLine($"next: {printQueue.Peek()}, waiting: {printQueue.Count}");
while (printQueue.TryDequeue(out var job))
{
    Console.WriteLine($"printing {job}");
}

var undo = new Stack<string>();
undo.Push("type 'Hello'");
undo.Push("make bold");
undo.Push("delete line");
Console.WriteLine($"undo {undo.Pop()}, then {undo.Pop()}; {undo.Count} left");
Console.WriteLine(undo.TryPop(out var step) ? step : "nothing");
Console.WriteLine(undo.TryPop(out var none) ? none : "nothing to undo");
```

```text
next: invoice.pdf, waiting: 3
printing invoice.pdf
printing label.png
printing report.docx
undo delete line, then make bold; 1 left
type 'Hello'
nothing to undo
```

`Dequeue`, `Pop` and `Peek` throw `InvalidOperationException` on an empty collection. The `Try`
versions return `false` instead, which makes them the natural loop condition. Both collections
add and remove in O(1) time, defined below.

## Sorted collections

A `Dictionary` and a `HashSet` do not promise any order. When you need keys in order, use
**`SortedDictionary<TKey, TValue>`** or **`SortedSet<T>`**, which keep their contents sorted at all
times using the type's `IComparable<T>` or a comparer you supply.

```csharp
var stock = new SortedDictionary<string, int>
{
    ["pears"] = 12,
    ["apples"] = 30,
    ["figs"] = 5,
};
stock["bananas"] = 18;
foreach (var (fruit, count) in stock)
{
    Console.Write($"{fruit}={count} ");
}
Console.WriteLine();

var scores = new SortedSet<int> { 70, 95, 70, 82 };
Console.WriteLine($"{string.Join(",", scores)} min={scores.Min} max={scores.Max}");
Console.WriteLine(string.Join(",", scores.GetViewBetween(75, 100)));

var tags = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Urgent", "urgent", "Later" };
Console.WriteLine(tags.Count);
```

```text
apples=30 bananas=18 figs=5 pears=12 
70,82,95 min=70 max=95
82,95
2
```

A `SortedSet` drops the duplicate 70 like any set, and it can answer range questions such as
`GetViewBetween`. The last lines show a **comparer**, an object that decides equality or order for
a collection: `StringComparer.OrdinalIgnoreCase` makes `"Urgent"` and `"urgent"` the same tag. Every
hashed and sorted collection accepts one in its constructor.

## Choosing a collection

**Big O notation** describes how an operation's cost grows with the number of items `n`: O(1)
stays the same however large the collection is, O(log n) grows very slowly, and O(n) grows in
proportion to the size. The costs below are the usual (amortized) case from the .NET documentation.

| Need | Collection | Add | Find by key or value |
| --- | --- | --- | --- |
| Items by position | `List<T>` | O(1) at the end | O(n) to search |
| Lookup by key | `Dictionary<TKey, TValue>` | O(1) | O(1) |
| Keys kept in order | `SortedDictionary<TKey, TValue>` | O(log n) | O(log n) |
| Unique items | `HashSet<T>` | O(1) | O(1) |
| Unique items in order | `SortedSet<T>` | O(log n) | O(log n) |
| First in, first out | `Queue<T>` | O(1) | not its job |
| Last in, first out | `Stack<T>` | O(1) | not its job |

Ask how the data will be *read*. "Check whether we have seen this" points to a set, "find by ID"
to a dictionary, "process in arrival order" to a queue. `Contains` on a `List<T>` looks at every
item, which is fine for ten items and slow for a million.

## Common mistakes

- **Parameters typed as `List<T>`.** Callers with an array must convert. Ask for
  `IEnumerable<T>`, or `IReadOnlyList<T>` if you need `Count` and an index.
- **Returning your private list.** Callers can change it behind your back. Return a read-only
  wrapper or a copy.
- **Searching a list in a loop.** `list.Contains` inside a loop over another list is O(n) per
  check. Build a `HashSet<T>` once.
- **Relying on dictionary order.** A `Dictionary` often appears to keep insertion order, but it
  does not promise to. Sort, or use a sorted collection.

## Practice

1. Which interface would you require from a method that only needs to loop over its input once?
2. Choose a collection: a browser's Back button; tickets served in arrival order; usernames that
   must be unique, checked thousands of times a second.
3. What does `new SortedSet<string> { "b", "a", "b" }.Count` return?

### Answers

1. `IEnumerable<T>`: it is the least demanding and every collection implements it.
2. A `Stack<T>` (the last page visited is the first to go back to), a `Queue<T>`, and a
   `HashSet<string>`, probably with `StringComparer.OrdinalIgnoreCase`.
3. `2`. A set stores each value once; the elements are `a` and `b`, in that order.

## Key takeaways

- Collections share interfaces: `IEnumerable<T>` for iteration, `ICollection<T>` and `IList<T>`
  for changes, and read-only variants for safe exposure.
- Accept the least capable interface you need; return read-only views, not your internal lists.
- Queues serve in arrival order, stacks in reverse order, and sorted collections keep keys in
  order at an O(log n) cost.

## Further reading

- [Collections and data structures (.NET)](https://learn.microsoft.com/en-us/dotnet/standard/collections/)
- [Selecting a collection class](https://learn.microsoft.com/en-us/dotnet/standard/collections/selecting-a-collection-class)
