---
title: Value and Reference Semantics
summary: Predict what assignment, comparison and method calls do to value types and reference types, write equality that hash-based collections can rely on, and recognise boxing.
minutes: 30
objectives:
  - Predict the result of copying and then changing a struct and a class
  - Choose between `==`, `Equals` and `ReferenceEquals`, and override `Equals` and `GetHashCode` together
  - Explain boxing and unboxing and spot the code that causes them
  - Explain what `ref` and `in` change for a value-type parameter and for a reference-type parameter
---

## Outline

1. Where the data lives
2. Copying
3. Equality: `==`, `Equals` and `ReferenceEquals`
4. `GetHashCode` must agree with `Equals`
5. Boxing
6. What `ref` and `in` change

## Where the data lives

Every C# type is either a **value type** or a **reference type**. Structs, enums, tuples and the
built-in numbers are value types: the variable *contains* the value. Classes, strings, arrays,
lists and delegates are reference types: the object lives on the **managed heap**, an area of
memory that the garbage collector looks after, and the variable contains only a **reference** to
it. These two words, *contains* and *refers to*, explain everything in this lesson. Behaviour that
follows from them is called **value semantics** and **reference semantics**.

## Copying

Assignment, passing an argument and returning a result all copy *what the variable holds*. For a
struct that is the whole value; for a class it is the reference, so both variables end up at the
same object.

```csharp
var s1 = new PointS { X = 1 };
var s2 = s1;   // copies the value
s2.X = 99;

var c1 = new PointC { X = 1 };
var c2 = c1;   // copies the reference
c2.X = 99;

Console.WriteLine($"struct: {s1.X} {s2.X}");
Console.WriteLine($"class:  {c1.X} {c2.X}");

var points = new List<PointS> { new PointS { X = 1 } };
var p = points[0];   // the indexer returns a copy
p.X = 5;
Console.WriteLine(points[0].X);
points[0] = p;       // store the changed copy back
Console.WriteLine(points[0].X);

struct PointS { public int X; }
class PointC { public int X; }
```

```text
struct: 1 99
class:  99 99
1
5
```

Reading `points[0]` hands you a copy of the struct inside the list. Changing a field of that copy
cannot reach the list, so the compiler refuses to let you try:

```csharp
points[0].X = 5;
```

```text
error CS1612: Cannot modify the return value of 'List<PointS>.this[int]' because it is not a variable
```

This is the strongest argument for the previous lesson's advice: a `readonly` struct has no fields
to change, so this whole class of surprise disappears.

## Equality: `==`, `Equals` and `ReferenceEquals`

C# has two ideas of "equal". **Value equality** means the data matches. **Reference equality**,
also called *identity*, means two references point at the same object.

- `ReferenceEquals(a, b)` always tests identity.
- `Equals` is a virtual method on every type (lesson 3 explains *virtual*). For a class it tests
  identity unless the class overrides it. For a struct it compares every field.
- `==` on a class tests identity unless the class defines its own `==` operator. `string` does, so
  two different string objects with the same characters are `==`. A struct gets no `==` at all:
  `m == n` on two `PointS` values fails with error CS0019, "Operator '==' cannot be applied to
  operands of type 'PointS' and 'PointS'".

A class that represents a value, such as a product code, should override `Equals` so that two
objects with the same data count as equal:

```csharp
var a = new Sku("BOLT-8");
var b = new Sku("BOLT-8");
Console.WriteLine($"{a == b} {a.Equals(b)} {ReferenceEquals(a, b)}");

var stock = new HashSet<Sku> { a };
Console.WriteLine(stock.Contains(b));

string s = "blue";
string t = new string(['b', 'l', 'u', 'e']);
Console.WriteLine($"{s == t} {ReferenceEquals(s, t)}");

class Sku
{
    public Sku(string code) => Code = code;
    public string Code { get; }

    public override bool Equals(object? obj) => obj is Sku other && other.Code == Code;
    public override int GetHashCode() => Code.GetHashCode();
}
```

```text
False True False
True
True False
```

`obj is Sku other` checks that `obj` is a `Sku` and, if it is, names it `other`; lesson 12 covers
this kind of test. Notice that `a == b` is still `False`: overriding `Equals` does not change `==`.
Records (lesson 5) generate `Equals`, `GetHashCode`, `==` and `!=` for you, consistently, and are
usually the better tool.

## `GetHashCode` must agree with `Equals`

A `HashSet<T>` or a `Dictionary<TKey, TValue>` does not compare a new item with every stored item.
It first calls `GetHashCode` to pick a **bucket**, a small group of items with the same hash code,
and calls `Equals` only inside that bucket. The rule is therefore strict: **if two objects are
equal, their hash codes must be equal.** Remove `GetHashCode` from `Sku` and the compiler warns:

```text
warning CS0659: 'Sku' overrides Object.Equals(object o) but does not override Object.GetHashCode()
```

With the warning ignored, `a.Equals(b)` is still `True`, but `stock.Contains(b)` printed `False`:
the default hash code comes from the object's identity, so `b` is looked for in the wrong bucket.
Build the hash from exactly the fields `Equals` compares; for several fields,
`HashCode.Combine(Code, Size)` mixes them into one. Unequal objects may share a hash code; that
only costs speed.

## Boxing

Every type, value types included, can be treated as an `object`. **Boxing** is how a value becomes
one: the runtime allocates a new object on the heap and copies the value into it. It happens
implicitly whenever a value type is converted to `object` or to an interface. **Unboxing** copies
the value back out and needs an explicit cast to the exact type that was boxed.

```csharp
int count = 5;
object boxed = count;   // boxing: the value is copied into a new object
count = 6;
Console.WriteLine($"{count} {boxed}");

int back = (int)boxed;  // unboxing: explicit, and checked at run time
Console.WriteLine(back);

try
{
    long wrong = (long)boxed;
    Console.WriteLine(wrong);
}
catch (InvalidCastException e)
{
    Console.WriteLine(e.Message);
}

Console.WriteLine(ReferenceEquals(count, count)); // two separate boxes
```

```text
6 5
5
Unable to cast object of type 'System.Int32' to type 'System.Int64'.
False
```

The box is an independent copy, so changing `count` leaves it at 5. Unboxing an `int` as a `long`
fails even though an `int` converts to a `long` normally. `ReferenceEquals` on a value type is
always `False`, because each argument is boxed separately. Boxing costs an allocation each time,
which matters in loops; generics (lesson 7) exist largely to avoid it.

## What `ref` and `in` change

By default every argument is passed **by value**: the parameter receives a copy of what the
argument variable holds. For a class that copy is a reference, so the method can change the shared
object but cannot make the caller's variable point anywhere else. `ref` passes the variable itself.

```csharp
var names = new List<string> { "ada" };
AddName(names);             // changes the shared list
Replace(names);             // changes only its own copy of the reference
Console.WriteLine(string.Join(",", names));
ReplaceByRef(ref names);    // changes the caller's variable
Console.WriteLine(string.Join(",", names));

static void AddName(List<string> list) => list.Add("grace");
static void Replace(List<string> list) => list = new List<string> { "new" };
static void ReplaceByRef(ref List<string> list) => list = new List<string> { "new" };
```

```text
ada,grace
new
```

For a struct, passing by value copies the whole struct. An `in` parameter passes a read-only
reference instead, which avoids copying a large struct and forbids the method from changing it;
assigning to an `in` parameter is error CS8331. For a small struct the copy is cheap, so plain
by-value parameters are usually fine.

## Common mistakes

- **Expecting `==` to compare a class's data.** Without an overloaded operator it compares
  references.
- **Overriding `Equals` without `GetHashCode`.** Sets and dictionary keys silently stop working.
- **Hashing a field that can change.** An object whose hash code changes while it is in a
  `HashSet` can no longer be found. Use immutable data for keys.
- **Changing a struct that came out of a collection.** You changed a copy. Store it back.

## Practice

1. `int[] a = [1, 2]; int[] b = a; b[0] = 9;` What is `a[0]`, and why?
2. A `List<object>` receives the numbers 1 to 1000 in a loop. How many boxes are created?
3. A method `void Grow(List<int> list)` runs `list = new List<int>(list) { 4 };`. Does the caller's
   list gain a 4?

### Answers

1. `9`. An array is a reference type even when its elements are values, so `a` and `b` refer to
   the same array.
2. 1000. Each `int` added to a list of `object` is boxed into its own new object. A `List<int>`
   stores them with no boxing at all.
3. No. The method builds a new list and points its own parameter at it. The caller's variable
   still refers to the original list, which is unchanged. With `ref`, the caller would see the new
   list.

## Key takeaways

- A value-type variable contains its data; a reference-type variable refers to an object.
  Assignment copies whichever of the two the variable holds.
- `ReferenceEquals` tests identity, `Equals` can be overridden for value equality, and `==` on a
  class means identity unless an operator says otherwise.
- Equal objects must have equal hash codes, or hash-based collections break.
- Converting a value type to `object` or to an interface boxes it into a new heap object.

## Further reading

- [Equality comparisons (C# fundamentals)](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/expressions/equality)
- [Boxing and unboxing](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/boxing-and-unboxing)
- [C# reference: Method parameters and modifiers](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/method-parameters)
