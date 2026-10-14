---
title: Records and Immutability
summary: Build data types whose values cannot change after creation, with `init` and `required` properties and with records, and make modified copies with `with` expressions.
minutes: 30
objectives:
  - Use `init` and `required` so that an object is fully set up at creation and cannot be changed afterwards
  - Declare positional record classes and record structs, and list the members the compiler generates for them
  - Create modified copies with a `with` expression and predict the result of comparing records
  - Explain why record immutability is shallow and what that means for collection properties
---

## Outline

1. Why immutable data
2. `init` accessors
3. `required` members
4. Records
5. `with` expressions
6. Record structs
7. Immutability is shallow

## Why immutable data

An **immutable** object cannot change once it has been created. That sounds like a restriction, but
it removes a whole family of bugs. Lesson 2 showed two variables sharing one object: if the object
can change, a change made through one variable surprises the code holding the other. An immutable
object can be shared freely, used safely as a dictionary key (its hash code never changes) and read
from several threads at once. To "change" it you build a new object with the new values. This
lesson shows the C# features that make that style comfortable.

## `init` accessors

A property with a `get` and no `set` can only be assigned in a constructor. An **`init`** accessor
also allows assignment in an **object initializer**, the `{ Name = value, ... }` block written
after `new`, but nowhere after that. You get readable construction and an object that is frozen
from then on.

```csharp
var order = new Order { Id = 1042, Customer = "Ada" };
Console.WriteLine($"#{order.Id} for {order.Customer}, notes: '{order.Notes}'");

class Order
{
    public required int Id { get; init; }
    public required string Customer { get; init; }
    public string Notes { get; init; } = "";
}
```

```text
#1042 for Ada, notes: ''
```

## `required` members

With `init` alone, a caller could forget a property and get an `Order` with no customer. The
**`required`** modifier makes the compiler insist that every object initializer sets that member.
Both mistakes are now compile errors:

```csharp
order.Customer = "Bo";
var half = new Order { Id = 7 };
```

```text
error CS8852: Init-only property or indexer 'Order.Customer' can only be assigned in an object initializer, or on 'this' or 'base' in an instance constructor or an 'init' accessor.
error CS9035: Required member 'Order.Customer' must be set in the object initializer or attribute constructor.
```

`required` means *must be set*, not *must not be null*: setting it to `null` explicitly compiles,
with a nullable warning for a non-nullable type. A constructor that sets every required member can
be marked `[SetsRequiredMembers]` so that callers using it need no initializer.

## Records

Writing a small immutable data class by hand takes a lot of code: properties, a constructor, value
equality with `Equals`, `GetHashCode`, `==` and `!=`, and a useful `ToString`. A **record** is a
class or struct for which the compiler writes all of that. The shortest form is the **positional
record**, where the parameter list after the name declares the data:

```csharp
var a = new Product("PEN-01", "Blue pen", 1.20m);
var b = new Product("PEN-01", "Blue pen", 1.20m);
Console.WriteLine(a);
Console.WriteLine($"{a == b} {ReferenceEquals(a, b)}");

var cheaper = a with { Price = 0.99m };   // a copy with one change
Console.WriteLine(cheaper);
Console.WriteLine(a.Price);               // the original is untouched

var (sku, _, price) = cheaper;
Console.WriteLine($"{sku} {price}");

public record Product(string Sku, string Name, decimal Price);
```

```text
Product { Sku = PEN-01, Name = Blue pen, Price = 1.20 }
True False
Product { Sku = PEN-01, Name = Blue pen, Price = 0.99 }
1.20
PEN-01 0.99
```

From that one line the compiler generates:

- a public `init` property for each parameter, and a constructor taking all of them;
- **value equality**: `Equals`, `GetHashCode`, `==` and `!=` compare every property, so `a == b` is
  `True` although they are two objects;
- a `ToString` that prints the type name and every public property;
- a `Deconstruct` method, so `var (sku, _, price) = cheaper;` works.

`record` on its own means `record class`, a reference type. A record can have a body with more
members, and it can inherit from another record, but not from an ordinary class:

```text
error CS8864: Records may only inherit from object or another record
```

## `with` expressions

A **`with` expression** is how you "change" immutable data: it copies the record and then sets the
properties listed in braces, leaving the original alone. This is called **nondestructive
mutation**. `a with { }` makes an exact copy. A computed property should be written with `=>`, so
that it is recalculated on the copy; a value calculated once in an initializer would keep the
original's result after a `with`.

## Record structs

`record struct` makes a value-type record and `readonly record struct` an immutable one. Choose
between them as you would between a struct and a class: small and value-like, use a record struct.

```csharp
var p = new Point(1, 2);
p.X = 10;                        // record struct: properties are settable
Console.WriteLine(p);

var pixel = new Pixel(3, 4);
Console.WriteLine(pixel with { Y = 0 });

var route = new Route("Depot", 12.5)
{
    Stops = ["Mill Lane", "High St"],
};
Console.WriteLine($"{route.Summary} | {route}");

public record struct Point(int X, int Y);
public readonly record struct Pixel(int X, int Y);

public record Route(string Start, double Km)
{
    public string[] Stops { get; init; } = [];
    public string Summary => $"{Start} + {Stops.Length} stops, {Km} km";
}
```

```text
Point { X = 10, Y = 2 }
Pixel { X = 3, Y = 0 }
Depot + 2 stops, 12.5 km | Route { Start = Depot, Km = 12.5, Stops = System.String[], Summary = Depot + 2 stops, 12.5 km }
```

Note the asymmetry: positional properties are `init` in a `record class` and in a
`readonly record struct`, but settable in a plain `record struct`. `Route` mixes positional
parameters with an ordinary `init` property set in an initializer. Its `ToString` shows the array
as `System.String[]`, because an array's own `ToString` prints only its type name.

## Immutability is shallow

`init` stops a property from being pointed at a different object. It does nothing to stop the
object it points at from changing. Generated equality compares each property with that property's
own `Equals`, which for a `List<T>` means reference equality.

```csharp
var team = new Team("Blue", new List<string> { "Ada" });
var copy = team with { };          // copies the reference to the same list
copy.Members.Add("Grace");
Console.WriteLine(string.Join(",", team.Members));
Console.WriteLine(team == copy);

var twin = new Team("Blue", new List<string> { "Ada", "Grace" });
Console.WriteLine(team == twin);   // a different list object

public record Team(string Name, List<string> Members);
```

```text
Ada,Grace
True
False
```

`with` copied the *reference*, so the "copy" shares the original's list. For data that should be
truly immutable, use read-only collection types (lesson 8) and do not hand out the list you store.

## Common mistakes

- **Expecting `with` to deep-copy.** It copies each property's value, and for a reference type that
  value is a reference.
- **Mutable collections in records.** Equality and immutability both break, as shown above.
- **Using records for objects with identity.** A customer account whose details change over time is
  still the same account; a class with reference equality fits it better.
- **Confusing `required` with non-null.** `required` checks that a value was *assigned*.

## Practice

1. Declare a positional record `Money(decimal Amount, string Currency)` and create a copy of
   `new Money(10, "EUR")` with an amount of 12.
2. Given `record Tag(string Name);`, what do `new Tag("x") == new Tag("x")` and
   `ReferenceEquals(new Tag("x"), new Tag("x"))` return?
3. A `public record Point(int X, int Y) { public double Length { get; } = Math.Sqrt(X * X + Y * Y); }`
   is copied with `p with { X = 6 }`. Why can `Length` be wrong, and how do you fix it?

### Answers

1. `public record Money(decimal Amount, string Currency);` and
   `var twelve = new Money(10, "EUR") with { Amount = 12 };`.
2. `True` and `False`. The generated `==` compares the property values, but the two objects are
   still separate instances.
3. The initializer runs once, when the original is constructed; `with` copies the stored value and
   then changes `X`. Write `public double Length => Math.Sqrt(X * X + Y * Y);` so it is computed on
   every read.

## Key takeaways

- `init` allows assignment only during creation; `required` makes the compiler check that it
  happened.
- A record generates value equality, `ToString`, `Deconstruct` and, in positional form, the
  properties and constructor.
- `with` makes a modified copy; the copy is shallow.
- `record` is a reference type, `record struct` a value type, and only `readonly record struct` and
  `record class` make positional properties `init`.

## Further reading

- [C# reference: Records](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record)
- [C# reference: required modifier](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/required)
- [Properties (C# programming guide)](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties)
