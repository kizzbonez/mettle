---
title: Interfaces
summary: Describe a capability as an interface, implement it in unrelated classes and structs, and use the standard interfaces that let .NET sort and compare your types.
minutes: 30
objectives:
  - Define an interface and implement it in several types, including more than one interface per type
  - Write methods and collections that depend on an interface instead of a concrete class
  - Use a default interface method and an explicit implementation, and say through which variables each can be called
  - Implement `IComparable<T>` and `IEquatable<T>` so that `Sort`, `Contains` and hash-based collections work
---

## Outline

1. An interface is a contract
2. Programming against the interface
3. Default interface methods
4. Explicit implementation
5. `IComparable<T>` and `IEquatable<T>`

## An interface is a contract

An **interface** names a set of members that a type promises to provide, without saying how. It is
declared with `interface`, and by convention its name starts with `I`. A class or struct
**implements** an interface by listing it after a colon and supplying every member. Unlike a base
class, an interface holds no instance data, and a type may implement as many interfaces as it
likes. That makes interfaces the tool for *capabilities* shared by types that are otherwise
unrelated: a parcel and a pallet have nothing in common except that both can be shipped.

```csharp
List<IShippable> load = [new Parcel(2.5m), new Pallet(12, 18.0m)];
decimal total = 0;
foreach (IShippable item in load)
{
    Console.WriteLine(item.Label());
    total += item.WeightKg;
}
Console.WriteLine($"Total {total} kg");
Console.WriteLine(load[0].Describe());   // default implementation

interface IShippable
{
    decimal WeightKg { get; }
    string Label();
    string Describe() => $"{Label()} ({WeightKg * 2.2m:0.#} lb)";
}

class Parcel : IShippable
{
    public Parcel(decimal weightKg) => WeightKg = weightKg;
    public decimal WeightKg { get; }
    public string Label() => $"Parcel, {WeightKg} kg";
}

class Pallet : IShippable
{
    public Pallet(int boxes, decimal kgPerBox)
    {
        Boxes = boxes;
        KgPerBox = kgPerBox;
    }

    public int Boxes { get; }
    public decimal KgPerBox { get; }
    public decimal WeightKg => Boxes * KgPerBox + 25m; // 25 kg for the pallet itself
    public string Label() => $"Pallet of {Boxes} boxes, {WeightKg} kg";
}
```

```text
Parcel, 2.5 kg
Pallet of 12 boxes, 241.0 kg
Total 243.5 kg
Parcel, 2.5 kg (5.5 lb)
```

Members declared without a body, such as `WeightKg` and `Label`, are implicitly `public` and
abstract: every implementing type must supply them, as public members with matching signatures.
`Parcel` stores its weight while `Pallet` computes it; the interface does not care. Leave one out
and the type does not compile:

```text
error CS0535: 'Crate' does not implement interface member 'IShippable.WeightKg'
```

A class that also has a base class lists the base first: `class Van : Vehicle, IShippable`.

## Programming against the interface

The loop above never mentions `Parcel` or `Pallet`. It depends only on `IShippable`, so a `Crate`
added next year works with it unchanged. This is the main reason to use interfaces: code that
*accepts* an interface can be reused with types its author never saw, and can be tested with a
small fake implementation. A variable of an interface type can hold any object that implements the
interface, and calls through it run that object's implementation, just as virtual calls do.

The .NET libraries are built this way. `foreach` works on anything that implements
`IEnumerable<T>`, `List<T>.Sort` works on anything that implements `IComparable<T>`, and lesson 8
shows the interfaces behind every collection.

## Default interface methods

`Describe` above has a body. That is a **default interface method**: implementing types get it for
free and may supply their own instead. It was added to C# so that a library can add a member to a
published interface without breaking every class that already implements it. A default method
belongs to the interface, not to the class, so it can only be called through an interface-typed
variable. `load[0]` has type `IShippable`, so `load[0].Describe()` works, but:

```csharp
var parcel = new Parcel(2.5m);
Console.WriteLine(parcel.Describe());
```

```text
error CS1061: 'Parcel' does not contain a definition for 'Describe' and no accessible extension method 'Describe' accepting a first argument of type 'Parcel' could be found (are you missing a using directive or an assembly reference?)
```

## Explicit implementation

Two interfaces may declare members with the same signature. A single public method would then
implement both, which is wrong if they mean different things. An **explicit implementation**
prefixes the member with the interface name and has no access modifier. It is reachable only
through a variable of that interface type.

```csharp
var sensor = new Thermometer(21.5);
ICelsius metric = sensor;
IFahrenheit imperial = sensor;
Console.WriteLine($"{metric.Reading()} C = {imperial.Reading()} F");

interface ICelsius { double Reading(); }
interface IFahrenheit { double Reading(); }

class Thermometer : ICelsius, IFahrenheit
{
    private readonly double celsius;
    public Thermometer(double celsius) => this.celsius = celsius;

    double ICelsius.Reading() => celsius;
    double IFahrenheit.Reading() => celsius * 9 / 5 + 32;
}
```

```text
21.5 C = 70.7 F
```

`sensor.Reading()` fails with the same CS1061 error. Explicit implementation is also used to keep a
member out of a class's everyday surface when it only matters to code that works through the
interface.

## `IComparable<T>` and `IEquatable<T>`

Two standard interfaces let the libraries handle your types. **`IComparable<T>`** has one method,
`int CompareTo(T? other)`, which returns a negative number if this instance sorts before `other`,
zero if they sort together and a positive number if it sorts after. By definition every object
sorts after `null`. `List<T>.Sort()`, `Min`, `Max` and sorted collections all call it.
**`IEquatable<T>`** has `bool Equals(T? other)`, a typed equality check that `Contains`,
`IndexOf`, `HashSet<T>` and `Dictionary<TKey, TValue>` use in preference to `Equals(object)`.

```csharp
var versions = new List<AppVersion>
{
    new AppVersion(2, 0), new AppVersion(1, 10), new AppVersion(1, 9),
};
versions.Sort();   // uses CompareTo
Console.WriteLine(string.Join(" < ", versions));
Console.WriteLine(versions.Contains(new AppVersion(1, 10)));   // uses Equals
Console.WriteLine(new AppVersion(1, 9).CompareTo(new AppVersion(1, 10)));

class AppVersion : IComparable<AppVersion>, IEquatable<AppVersion>
{
    public AppVersion(int major, int minor)
    {
        Major = major;
        Minor = minor;
    }

    public int Major { get; }
    public int Minor { get; }

    public int CompareTo(AppVersion? other)
    {
        if (other is null) return 1;   // any version sorts after null
        int byMajor = Major.CompareTo(other.Major);
        return byMajor != 0 ? byMajor : Minor.CompareTo(other.Minor);
    }

    public bool Equals(AppVersion? other) =>
        other is not null && Major == other.Major && Minor == other.Minor;

    public override bool Equals(object? obj) => Equals(obj as AppVersion);
    public override int GetHashCode() => HashCode.Combine(Major, Minor);
    public override string ToString() => $"{Major}.{Minor}";
}
```

```text
1.9 < 1.10 < 2.0
True
-1
```

Compare the most significant part first and fall back to the next only on a tie. Comparing the
text `"1.10"` with `"1.9"` would put 1.10 first, which is why versions are compared as numbers.
`obj as AppVersion` converts `obj` to `AppVersion`, or gives `null` if it is something else.
Implementing `IEquatable<T>` still means overriding `Equals(object)` and `GetHashCode`, so that
every route to equality gives the same answer.

## Common mistakes

- **Expecting a default method on the class.** Call it through the interface type, or implement it
  in the class.
- **Leaving `CompareTo` and `Equals` inconsistent.** If `CompareTo` says zero, `Equals` should say
  `true`; sorted and hashed collections disagree otherwise.
- **An interface for everything.** One with a single implementation that will never change adds
  indirection and no value.
- **Subtracting in `CompareTo`.** `return Major - other.Major;` overflows for extreme values. Use
  `Major.CompareTo(other.Major)`.

## Practice

1. Write an interface `IDiscountable` with a method `decimal Discount(decimal price)` and a default
   method `decimal Apply(decimal price) => price - Discount(price);`.
2. `Thermometer t = new(20);` Which of `t.Reading()`, `((ICelsius)t).Reading()` and
   `((IFahrenheit)t).Reading()` compile?
3. Change `AppVersion.CompareTo` so that versions sort newest first.

### Answers

1. `interface IDiscountable { decimal Discount(decimal price); decimal Apply(decimal price) => price - Discount(price); }`.
   Remember that `Apply` is only visible through an `IDiscountable` variable.
2. The last two. The casts convert `t` to an interface type, through which the explicit
   implementations are visible; `t.Reading()` is error CS1061.
3. Swap the receiver and the argument: `other.Major.CompareTo(Major)` and
   `other.Minor.CompareTo(Minor)`. Negating the result also works. `Sort` itself is unchanged.

## Key takeaways

- An interface is a contract of members; a type can implement many, and code written against the
  interface works with all of them.
- Default interface methods and explicit implementations are reachable only through the interface
  type.
- `IComparable<T>` gives your type an order and `IEquatable<T>` a typed equality, and the standard
  collections use both.

## Further reading

- [C# reference: interface](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/interface)
- [Explicit interface implementation](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/interfaces/explicit-interface-implementation)
- [IComparable&lt;T&gt;.CompareTo(T) method](https://learn.microsoft.com/en-us/dotnet/api/system.icomparable-1.compareto)
