---
title: Generics
summary: Write one method or class that works for many types without giving up type safety, constrain its type parameters to the operations it needs, and see why generics beat `object`.
minutes: 30
objectives:
  - Explain the type-safety and boxing problems of storing values as `object`, and how generics remove them
  - Write generic methods and let the compiler infer their type arguments
  - Constrain a type parameter with an interface, a base class, `new()`, `class`, `struct` or `notnull`, and read error CS0311
  - Write a generic class that uses `default` for a type parameter
---

## Outline

1. The problem with `object`
2. Generic methods
3. Constraints
4. Generic classes and `default`
5. How generics run

## The problem with `object`

Lesson 2 showed that anything can be stored as an `object`. Before generics, .NET collections did
exactly that. `ArrayList` holds `object`s, so it accepts anything, and every read needs a cast:

```csharp
var old = new System.Collections.ArrayList();   // stores everything as object
old.Add(42);       // the int is boxed
old.Add("oops");   // nothing stops a string getting in

try
{
    int total = 0;
    foreach (object item in old)
    {
        total += (int)item;   // a cast on every read, checked only at run time
    }
}
catch (InvalidCastException e)
{
    Console.WriteLine($"Run time: {e.Message}");
}

var numbers = new List<int> { 42 };   // stores ints as ints
Console.WriteLine(numbers[0] + 1);    // no cast, no boxing
```

```text
Run time: Unable to cast object of type 'System.String' to type 'System.Int32'.
43
```

Three problems: the mistake is found at run time instead of compile time, every `int` is boxed
into a new object, and the casts clutter the code. `List<int>` fixes all three, because
`numbers.Add("oops")` does not even compile:

```text
error CS1503: Argument 1: cannot convert from 'string' to 'int'
```

`List<T>` is **generic**: `T` is a **type parameter**, a placeholder for a type, and `int` is the
**type argument** that fills it. You have used generic types since the Basic level. This lesson
shows how to write your own.

## Generic methods

A **generic method** declares its type parameters in angle brackets after its name. Inside, `T` is
used like any other type. When you call the method, the compiler usually **infers** the type
argument from the arguments, so you rarely write it.

```csharp
int[] scores = [3, 9, 4];
string[] fruit = ["pear", "apple", "fig"];
Console.WriteLine(Largest(scores));             // T is inferred as int
Console.WriteLine(Largest(fruit));              // T is inferred as string
Console.WriteLine(Largest<double>([2.5, 1]));   // T given explicitly

int a = 1, b = 2;
Swap(ref a, ref b);
Console.WriteLine($"{a} {b} {Describe(a)} {Describe("hi")}");

static T Largest<T>(T[] items) where T : IComparable<T>
{
    T best = items[0];
    foreach (T item in items)
    {
        if (item.CompareTo(best) > 0) best = item;   // allowed by the constraint
    }
    return best;
}

static void Swap<T>(ref T first, ref T second) => (first, second) = (second, first);

static string Describe<T>(T value) => $"{typeof(T).Name}:{value}";
```

```text
9
pear
2.5
2 1 Int32:2 String:hi
```

One `Largest` serves integers, strings and anything else that can be compared, and each call is
fully type-checked. `typeof(T)` shows that the real type argument is known while the program runs.

## Constraints

Inside a generic method, the compiler knows nothing about `T` except that it is some type, so it
allows only what every type supports: the members of `object`. To call `CompareTo`, `Largest` adds
the **constraint** `where T : IComparable<T>`. A constraint is a promise checked at each call: the
method may now use the interface's members, and callers may only pass types that implement it.

```text
error CS0311: The type 'Customer' cannot be used as type parameter 'T' in the generic type or method 'Largest<T>(T[])'. There is no implicit reference conversion from 'Customer' to 'System.IComparable<Customer>'.
```

That is `Largest(new[] { new Customer() })` with a class that is not comparable. The common
constraints are:

- `where T : SomeInterface` or `where T : SomeBaseClass`: `T` has those members.
- `where T : class`: `T` is a reference type. `where T : struct`: a non-nullable value type.
- `where T : notnull`: `T` is any non-nullable type.
- `where T : new()`: `T` has a public parameterless constructor, so the code can write `new T()`.

Several can be combined, separated by commas. `class`, `struct` or `notnull` must come first and
`new()` last.

```csharp
var registry = new Registry<Printer>();
var first = registry.Create("lobby");
var second = registry.Create("office");
Console.WriteLine($"{first.Id}:{first.Name} {second.Id}:{second.Name}");

abstract class Device
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

class Printer : Device { }

class Registry<TDevice> where TDevice : Device, new()
{
    private int nextId = 1;

    public TDevice Create(string name)
    {
        var device = new TDevice();   // allowed by new()
        device.Id = nextId++;         // allowed by the Device base-class constraint
        device.Name = name;
        return device;
    }
}
```

```text
1:lobby 2:office
```

`Create` returns a `Printer`, not a `Device`, so callers need no cast. With several type
parameters, give them descriptive names that start with `T`, such as `TKey` and `TValue`.

## Generic classes and `default`

A **generic class** declares type parameters after its name, and its fields, properties and methods
use them. `default`, or `default(T)`, is the default value of whatever `T` turns out to be: `null`
for a reference type, zero for a number.

```csharp
var pages = new RecentList<string>(3);
foreach (string page in new[] { "home", "cart", "help", "checkout" })
{
    pages.Add(page);
}
Console.WriteLine($"{string.Join(" > ", pages.Items)} (latest: {pages.Latest})");

var readings = new RecentList<double>(2);
Console.WriteLine($"empty: '{readings.Latest}' and '{pages.Count}'");

class RecentList<T>
{
    private readonly List<T> items = new();
    private readonly int capacity;

    public RecentList(int capacity) => this.capacity = capacity;

    public int Count => items.Count;
    public IEnumerable<T> Items => items;
    public T? Latest => items.Count > 0 ? items[items.Count - 1] : default;

    public void Add(T item)
    {
        items.Add(item);
        if (items.Count > capacity) items.RemoveAt(0);   // forget the oldest
    }
}
```

```text
cart > help > checkout (latest: checkout)
empty: '0' and '3'
```

Beware the last line. For an unconstrained `T`, `T?` means "may be null *if* `T` is a reference
type"; for `double` it is just `double`, so an empty list reports `0`, which looks like a real
reading. When "no value" must be distinguishable, return a `bool` with an `out` parameter, as
`Dictionary.TryGetValue` does, or constrain `T`.

## How generics run

C# generics are not copied and pasted text. The compiled program keeps `RecentList<T>` as one
generic type, and the runtime creates the concrete versions as they are first used. Each value type
argument gets its own specialised code, so a `List<int>` stores real `int`s with no boxing. All
reference type arguments share one version, because every reference has the same size. The type
argument is still known at run time, which is why `typeof(T).Name` printed `Int32`.

## Common mistakes

- **Reaching for `object`.** If a method takes `object` and casts it back, it wants to be generic.
- **Missing constraints.** Error CS0019 or CS1061 on a `T` usually means a constraint is missing.
- **Over-constraining.** Every constraint narrows who can call you; ask only for what you use.
- **Using `==` on `T`.** An unconstrained `T` has no `==`. Use `EqualityComparer<T>.Default.Equals`
  or `IEquatable<T>`.

## Practice

1. Write `static T FirstOr<T>(List<T> items, T fallback)` returning the first item or `fallback`.
2. Write `static int CountAbove<T>(T[] items, T limit) where T : IComparable<T>`.
3. Why does `class Pair<T> { public T Max(T a, T b) => a > b ? a : b; }` not compile?

### Answers

1. `items.Count > 0 ? items[0] : fallback`. No constraint is needed, because nothing is done with
   `T` except returning it.
2. Count the items for which `item.CompareTo(limit) > 0`. `CountAbove([1, 5, 9], 4)` gives 2.
3. `>` is not defined for every possible `T`. Add `where T : IComparable<T>` and write
   `a.CompareTo(b) > 0 ? a : b`.

## Key takeaways

- Generics give one implementation for many types, checked at compile time and without boxing.
- The compiler infers type arguments from the arguments of a call.
- Constraints tell the compiler what `T` can do; callers must satisfy them.
- `default` is `null` for references and zero for values, so `T?` on an unconstrained `T` cannot
  always signal "nothing".

## Further reading

- [Constraints on type parameters](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/constraints-on-type-parameters)
- [Generics in the runtime](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/generics-in-the-run-time)
- [Boxing and unboxing](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/boxing-and-unboxing)
