---
title: Generics in Depth
summary: Learn when one generic type can stand in for another through covariance and contravariance, use the `notnull`, `unmanaged` and `new()` constraints, and write algorithms over any numeric type with static abstract interface members and generic math.
minutes: 30
objectives:
  - Explain why `List<string>` is not a `List<object>` but `IEnumerable<string>` is an `IEnumerable<object>`
  - Mark an interface's type parameter `out` or `in` and say which uses the compiler then rejects
  - Choose among the `notnull`, `unmanaged`, `new()` and other constraints for a generic method
  - Write a generic method that calls static members and operators through a type parameter, using generic math interfaces
---

## Outline

1. Invariance: the default
2. Covariance with `out`
3. Contravariance with `in`
4. Writing your own variant interface
5. More constraints
6. Static abstract interface members
7. Generic math

## Invariance: the default

A `string` is an `object`, so you might expect a `List<string>` to be a `List<object>`. It is not, and for a good reason: a `List<object>` lets you `Add(42)`, which would put a number into a list of strings. So two constructed types such as `List<string>` and `List<object>` are unrelated, whatever the relation between their type arguments. That is **invariance**, and it is the default for every generic type.

## Covariance with `out`

Many interfaces only ever hand values *out*. `IEnumerable<T>` produces items and never accepts one, so treating an `IEnumerable<string>` as an `IEnumerable<object>` cannot go wrong: every item that comes out is a string, and a string is an object. The interface says so by declaring its parameter `out T`, which makes it **covariant**: the conversion goes in the same direction as the type arguments. `IEnumerable<T>`, `IReadOnlyList<T>`, `IReadOnlyCollection<T>` and the result of `Func<..., TResult>` are covariant.

## Contravariance with `in`

Other interfaces only *take* values in. An `IComparer<object>` can compare any two objects, so it can certainly compare two strings and may be used where an `IComparer<string>` is wanted. Here the conversion runs in the *opposite* direction to the type arguments, which is **contravariance**, declared as `in T`. `IComparer<T>`, `IEqualityComparer<T>`, `Action<T>` and the parameters of `Func` are contravariant.

```csharp
IEnumerable<string> names = new List<string> { "nut", "bolt" };
IEnumerable<object> things = names; // covariance: IEnumerable<out T>
Console.WriteLine($"{things.Count()} things");

Action<object> logAnything = item => Console.WriteLine($"log {item}");
Action<string> logName = logAnything; // contravariance: Action<in T>
logName("washer");

IComparer<object> byText = Comparer<object>.Create(
    (a, b) => string.CompareOrdinal(a?.ToString(), b?.ToString()));
var parts = new SortedSet<string>(byText) { "nut", "bolt", "gear" }; // wants IComparer<string>
Console.WriteLine(string.Join(",", parts));

object[] boxes = new string[2]; // array covariance compiles...
try
{
    boxes[0] = 42; // ...but this store fails at run time
}
catch (ArrayTypeMismatchException e)
{
    Console.WriteLine(e.GetType().Name);
}
```

```text
2 things
log washer
bolt,gear,nut
ArrayTypeMismatchException
```

The last lines show why generic variance is restricted to safe directions. Arrays of reference types have been covariant since .NET 1.0, *including* for writes, so the runtime must check every store into such an array and throws when the check fails. Generic variance is checked by the compiler instead, so it never fails at run time.

## Writing your own variant interface

Only **interfaces and delegates** can declare variant type parameters; classes and structs are always invariant. Variance also works only between **reference types**: `IEnumerable<int>` does not convert to `IEnumerable<object>`, because turning an `int` into an `object` needs boxing, a real change of representation. The compiler checks every use of the parameter:

```csharp
List<object> shelf = new List<string>();
IEnumerable<object> counts = new List<int>();

interface IBin<out T>
{
    void Put(T item);
}
```

```text
error CS1961: Invalid variance: The type parameter 'T' must be contravariantly valid on 'IBin<T>.Put(T)'. 'T' is covariant.
error CS0029: Cannot implicitly convert type 'System.Collections.Generic.List<string>' to 'System.Collections.Generic.List<object>'
error CS0266: Cannot implicitly convert type 'System.Collections.Generic.List<int>' to 'System.Collections.Generic.IEnumerable<object>'. An explicit conversion exists (are you missing a cast?)
```

(The compiler reports the declaration error first; the other two appear once it is fixed.) A common design splits an interface in two, a covariant `IReader<out T>` and a contravariant `IWriter<in T>`, so each half can vary.

## More constraints

The medium level used `where T : class`, `where T : struct`, a base class and interfaces. Three more are worth knowing:

- `where T : notnull` allows any type except a nullable one. `Dictionary<TKey, TValue>` uses it for keys. Breaking it gives warning `CS8714`, as nullability checks are warnings.
- `where T : unmanaged` requires a value type with no references inside, at any depth: `int`, `double`, `DateTime`, or a struct made only of such fields. Such values can be copied as raw bytes, which low-level code relies on.
- `where T : new()` requires a public parameterless constructor, so the method may write `new T()`. It must come last in the list.

```csharp
Make<string>();
Size<string>();
var registry = new Registry<string?>();

static T Make<T>() where T : new() => new T();
static int Size<T>() where T : unmanaged => Unsafe.SizeOf<T>();

class Registry<TKey> where TKey : notnull { }
```

```text
error CS0310: 'string' must be a non-abstract type with a public parameterless constructor in order to use it as parameter 'T' in the generic type or method 'Make<T>()'
error CS8377: The type 'string' must be a non-nullable value type, along with all fields at any level of nesting, in order to use it as parameter 'T' in the generic type or method 'Size<T>()'
warning CS8714: The type 'string?' cannot be used as type parameter 'TKey' in the generic type or method 'Registry<TKey>'. Nullability of type argument 'string?' doesn't match 'notnull' constraint.
```

## Static abstract interface members

An ordinary interface describes what an *instance* can do. Sometimes you need what a *type* can do: create a value from a string, say what kind it is, add two values with `+`. Since C# 11 an interface can declare `static abstract` members (and `static virtual` ones with a default body). A generic method can then call them through the type parameter, as `T.Create()`. They cannot be called through the interface itself, since the interface has no implementation of its own.

Such interfaces usually take the implementing type as a parameter, `ILabelled<TSelf> where TSelf : ILabelled<TSelf>`, so that members can mention "my own type", as `static abstract TSelf Create()` does below.

## Generic math

.NET 7 used this feature to give every built-in numeric type a set of interfaces in `System.Numerics`: `IAdditionOperators<TSelf, TOther, TResult>` for `+`, `IAdditiveIdentity<TSelf, TResult>` for zero, and the all-in-one `INumber<T>` with `T.Zero`, `T.One` and conversions such as `T.CreateChecked(value)`. One method can now serve `int`, `decimal`, `double` and your own types.

```csharp
Console.WriteLine(Total([1, 2, 3]));
Console.WriteLine(Total([0.5m, 0.25m]));
Console.WriteLine(Total([new Weight(2.5), new Weight(1.25)]));
Console.WriteLine(Average([2, 3]));
Console.WriteLine(Average([2.0, 3.0]));
Console.WriteLine(Describe<Pallet>());

static T Total<T>(IEnumerable<T> values)
    where T : IAdditionOperators<T, T, T>, IAdditiveIdentity<T, T>
{
    T sum = T.AdditiveIdentity;
    foreach (T value in values)
        sum += value;
    return sum;
}

static T Average<T>(IReadOnlyList<T> values) where T : INumber<T>
{
    T sum = T.Zero;
    foreach (T value in values) sum += value;
    return sum / T.CreateChecked(values.Count);
}

static string Describe<T>() where T : ILabelled<T> => $"{T.Kind}: {T.Create().Label}";

interface ILabelled<TSelf> where TSelf : ILabelled<TSelf>
{
    static abstract string Kind { get; }
    static abstract TSelf Create();
    string Label { get; }
}

sealed class Pallet : ILabelled<Pallet>
{
    public static string Kind => "pallet";
    public static Pallet Create() => new();
    public string Label => "EUR 1200x800";
}

readonly record struct Weight(double Kg)
    : IAdditionOperators<Weight, Weight, Weight>, IAdditiveIdentity<Weight, Weight>
{
    public static Weight AdditiveIdentity => new(0);
    public static Weight operator +(Weight left, Weight right) => new(left.Kg + right.Kg);
}
```

```text
6
0.75
Weight { Kg = 3.75 }
2
2.5
pallet: EUR 1200x800
```

`Total` asks only for what it uses, `+` and a zero, so `Weight` can join in by implementing two small interfaces. `Average([2, 3])` gives `2` because `T` is `int` and integer division truncates: generic code follows each type's own rules. All of this is resolved per type argument, so there is no boxing or virtual call per addition.

## Common mistakes

- **Expecting `List<Derived>` to convert to `List<Base>`.** Accept `IEnumerable<Base>` or `IReadOnlyList<Base>` instead.
- **Expecting variance for value types**, such as `IEnumerable<int>` to `IEnumerable<object>`.
- **Writing into a covariant array** (`object[] a = new string[1]`).
- **Reaching for `dynamic` or overloads per numeric type** when one `INumber<T>` method would do.

## Practice

1. Which compile: (a) `IReadOnlyList<object> a = new List<string>();` (b) `IComparer<string> b = Comparer<object>.Default;` (c) `Func<object> c = () => "x"; Func<string> d = c;`
2. Declare `interface ISource<out T> { T Next(); }` and explain why adding `bool Contains(T item);` breaks it.
3. Write `static T Max<T>(IEnumerable<T> values) where T : INumber<T>` that returns the largest value, or `T.Zero` for an empty sequence.

### Answers

1. (a) and (b) compile: `IReadOnlyList<out T>` is covariant and `IComparer<in T>` is contravariant. (c) does not: `Func<out TResult>` converts only from `Func<string>` to `Func<object>`, never the other way.
2. `Contains` takes a `T` as input, and a covariant parameter may appear only in output positions (`CS1961`). Otherwise an `ISource<object>` that is really an `ISource<string>` could be asked about a number.
3. For example:

   ```csharp
   static T Max<T>(IEnumerable<T> values) where T : INumber<T>
   {
       bool any = false;
       T best = T.Zero;
       foreach (T value in values)
       {
           if (!any || value > best) best = value;
           any = true;
       }
       return best;
   }
   ```

## Key takeaways

- Generic types are invariant unless an interface or delegate declares `out` or `in`.
- `out T` (covariant) is for producers, `in T` (contravariant) for consumers; the compiler checks the positions.
- Variance applies to reference types only, and array covariance can fail at run time.
- `notnull`, `unmanaged` and `new()` express what a method needs from `T`.
- Static abstract members let generic code call `T.Create()` and operators; generic math builds on them.

## Further reading

- [Microsoft Learn: Covariance and contravariance in generics](https://learn.microsoft.com/en-us/dotnet/standard/generics/covariance-and-contravariance)
- [Microsoft Learn: Explore static virtual members in interfaces](https://learn.microsoft.com/en-us/dotnet/csharp/advanced-topics/interface-implementation/static-virtual-interface-members)
