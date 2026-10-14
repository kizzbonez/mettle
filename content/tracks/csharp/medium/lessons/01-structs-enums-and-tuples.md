---
title: Structs, Enums and Tuples
summary: Define your own value types with `struct`, name a fixed set of choices with `enum` (including combinable flags), and group values on the fly with tuples and deconstruction.
minutes: 25
objectives:
  - Define a `readonly struct` with a constructor, a computed property and a `Deconstruct` method, and predict its default value
  - Convert an enum to and from its number and its name, and validate a number that came from outside
  - Build a `[Flags]` enum and add, remove and test flags with `|`, `&` and `~`
  - Return several values from a method as a named tuple and deconstruct the result, using discards where needed
---

## Outline

1. Value types you define yourself
2. Defining a struct
3. Enums
4. Flags: several choices at once
5. Tuples and deconstruction

## Value types you define yourself

The Basic level built **classes**. A variable of a class type holds a *reference*, a pointer to an
object that lives elsewhere in memory, so two variables can point at the same object. C# has a
second kind of type, the **value type**, whose variable holds the data itself. `int`, `double` and
`bool` are value types: assigning one variable to another copies the data, and from then on the
two are independent. This lesson shows how to write three kinds of value type yourself; the next
lesson looks at what copying means for your programs.

## Defining a struct

A **struct** is declared like a class, with `struct` in place of `class`. Use one for a small value
that is defined entirely by its data: a size, a coordinate, an amount of money. Microsoft's
guidance is to keep structs small and **immutable**, meaning that their data cannot change once
they are built. The `readonly` modifier makes the compiler enforce that: every field must be
`readonly` and every property get-only or `init` (lesson 5).

```csharp
var tile = new Size(3, 4);
Size copy = tile; // copies both values
Console.WriteLine($"{tile} has area {tile.Area}, copy is {copy}");

Console.WriteLine(new Size());     // every struct has this constructor
Console.WriteLine(default(Size));  // all fields zero
var floor = new Size[2];           // elements start at default
Console.WriteLine(floor[1]);

var (w, h) = tile;                 // uses Deconstruct
Console.WriteLine($"w={w} h={h}");

public readonly struct Size
{
    public Size(int width, int height)
    {
        Width = width;
        Height = height;
    }

    public int Width { get; }
    public int Height { get; }
    public int Area => Width * Height;

    public void Deconstruct(out int width, out int height)
    {
        width = Width;
        height = Height;
    }

    public override string ToString() => $"{Width}x{Height}";
}
```

```text
3x4 has area 12, copy is 3x4
0x0
0x0
0x0
w=3 h=4
```

- Every struct has a public parameterless constructor, and `new Size()` sets each field to its
  zero value (`0`, `false` or `null`). `default(Size)` and the elements of a new array get the
  same value, so a struct must make sense when every field is zero.
- `Area` is a **computed property**: the `=>` gives it a body that runs each time it is read, so
  it can never disagree with `Width` and `Height`.
- `override string ToString()` replaces the text `Console.WriteLine` prints; lesson 3 explains
  `override`. `Deconstruct` is explained at the end of this lesson.

Because `Size` is `readonly`, changing it is a compile error:

```csharp
tile.Width = 5;
```

```text
error CS0200: Property or indexer 'Size.Width' cannot be assigned to -- it is read only
```

A struct cannot inherit from another type and nothing can inherit from it, but it can implement
interfaces (lesson 4).

## Enums

An **enumeration type**, or enum, gives names to a fixed set of related integer constants. Stored as
a plain `int`, an order status could be mixed up with a quantity, and nothing would stop a caller
from passing 57. With an enum the compiler knows both the names and the type.

```csharp
OrderStatus status = OrderStatus.Shipped;
Console.WriteLine($"{status} = {(int)status}");
Console.WriteLine((OrderStatus)1);
Console.WriteLine(Enum.Parse<OrderStatus>("Delivered"));
Console.WriteLine(default(OrderStatus));

OrderStatus odd = (OrderStatus)42; // compiles: any int converts
Console.WriteLine($"{odd} defined? {Enum.IsDefined(odd)}");

enum OrderStatus
{
    Pending,       // 0
    Paid,          // 1
    Shipped = 10,
    Delivered      // 11
}
```

```text
Shipped = 10
Paid
Delivered
Pending
42 defined? False
```

- Members count up from 0 by one unless you give a value, so `Delivered` follows `Shipped = 10`.
  The backing type is `int` unless you write another, as in `enum OrderStatus : byte`.
- Casts convert between the member and its number; `ToString()` and `Enum.Parse<T>` convert
  between the member and its name.
- The default value of every enum is 0, whether or not a member has that value. Make 0 a sensible
  member such as `Pending` or `None`.
- **Any** integer can be cast to an enum, even one with no member. When a number arrives from a
  file, a database or a user, check it with `Enum.IsDefined` before you trust it.

## Flags: several choices at once

An ordinary enum value is exactly one choice. Sometimes you need a *set* of choices, such as a user
who may read and write but not delete. Give each member its own bit, using the powers of two 1, 2,
4, 8 and so on, and mark the enum with `[Flags]`. Square brackets before a declaration hold an
**attribute**, a label that adds information to it; `[Flags]` tells `ToString` to list every
member a combined value contains.

```csharp
Access editor = Access.Read | Access.Write;
Console.WriteLine(editor);
Console.WriteLine(editor.HasFlag(Access.Write));
Console.WriteLine((editor & Access.Delete) != 0);

editor |= Access.Delete;   // add a flag
editor &= ~Access.Write;   // remove a flag
Console.WriteLine(editor);
Console.WriteLine($"{Access.All} = {(int)Access.All}");

[Flags]
enum Access
{
    None = 0,
    Read = 1,
    Write = 2,
    Delete = 4,
    All = Read | Write | Delete
}
```

```text
Read, Write
True
False
Read, Delete
All = 7
```

- `|` (bitwise OR) combines: the result has every bit set on either side.
- `&` (bitwise AND) keeps only the bits set on both sides, so `(value & flag) != 0` means
  "contains this flag". `HasFlag` says the same in words.
- `~` flips every bit, so `value &= ~flag` clears one flag and keeps the rest.
- Test for `None` with `==`, never with `&`: `x & Access.None` is always zero.

## Tuples and deconstruction

A **tuple** groups a few values without declaring a new type. You write the values in parentheses,
`(7, 31)`, and a tuple type lists the element types with optional names: `(int Min, int Max)`. Its
most common use is returning several values from a method, which reads better than `out`
parameters.

```csharp
int[] readings = [12, 7, 31, 18];

var stats = Spread(readings);
Console.WriteLine($"{stats.Min} {stats.Item2} {stats}");

var (low, high) = Spread(readings);
var (_, peak) = Spread(readings);   // discard what you do not need
Console.WriteLine($"{low} to {high}, peak {peak}");

(string Name, int Score) best = ("Ada", 91);
var other = (Who: "Ada", Points: 91);
Console.WriteLine(best == other);   // names are ignored

int a = 1, b = 2;
(a, b) = (b, a);                    // swap without a temporary
Console.WriteLine($"a={a} b={b}");

static (int Min, int Max) Spread(int[] values)
{
    int min = values[0], max = values[0];
    foreach (int v in values)
    {
        if (v < min) min = v;
        if (v > max) max = v;
    }
    return (min, max);
}
```

```text
7 31 (7, 31)
7 to 31, peak 31
True
a=2 b=1
```

- Elements can always be reached as `Item1`, `Item2` and so on, named or not.
- `==` compares tuples element by element, in order. Names play no part.
- A tuple's elements are public fields, so tuples are mutable. That is fine for a short-lived
  local; data that travels through a program deserves a struct or record with a real name.

**Deconstruction** unpacks a value into separate variables in one statement, position by
position. The **discard** `_` fills a position you do not need, and deconstructing into existing
variables gives the one-line swap. Any type can join in by declaring a `Deconstruct` method with
one `out` parameter per part, as `Size` does. Dictionary entries have one, so
`foreach (var (key, value) in dictionary)` works.

## Common mistakes

- **Mutable structs.** Code changes a *copy* and wonders why the original did not change. Make
  structs `readonly`.
- **Large structs.** Every assignment and every call copies the whole value. Beyond a handful of
  fields, a class is usually better.
- **Trusting a cast enum.** `(OrderStatus)number` never fails, whatever the number.
- **Flags that are not powers of two.** With `Delete = 3`, `Delete` equals `Read | Write`.

## Practice

1. Declare a `readonly struct Money` with a `decimal Amount`, a `string Currency` and a `ToString`
   that gives `12.50 EUR`.
2. Declare a `[Flags]` enum `Days` with the seven days and a `Weekend` member. Write the test for
   "the value `d` contains the whole weekend".
3. Write `static (int Words, int Letters) Count(string text)` and call it with a deconstruction
   that keeps only the letters.

### Answers

1. A constructor assigns two get-only properties, and
   `public override string ToString() => $"{Amount:0.00} {Currency}";` prints two decimals.
2. Give the days 1, 2, 4, 8, 16, 32 and 64, then `Weekend = Saturday | Sunday`. The test is
   `(d & Days.Weekend) == Days.Weekend` or `d.HasFlag(Days.Weekend)`. Testing `!= 0` would also be
   true when only one of the two days is present.
3. Count words with `text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length` and letters
   with `char.IsLetter` in a loop, then `return (words, letters);`. The call
   `var (_, letters) = Count("to be or not");` gives 9.

## Key takeaways

- A struct is a value type: assignment copies its data. Keep it small and `readonly`.
- Every struct and enum has an all-zero default value; design for it.
- An enum names a fixed set of integer constants; `[Flags]` with powers of two makes sets of them.
- Tuples return several values without a new type, deconstruction unpacks them, and `Deconstruct`
  lets your own types join in.

## Further reading

- [C# reference: Structure types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/struct)
- [C# reference: Enumeration types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/enum)
- [C# reference: Tuple types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-tuples)
- [Deconstructing tuples and other types](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/patterns/deconstruct)
