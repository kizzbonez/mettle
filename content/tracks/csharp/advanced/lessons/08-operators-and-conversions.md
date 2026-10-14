---
title: Operators and Conversions
summary: Give your own types arithmetic, comparison and equality operators that behave like the built-in ones, add implicit and explicit conversions, and use C# 14's user-defined compound assignment to update objects in place.
minutes: 30
objectives:
  - Overload arithmetic and comparison operators following the rules the compiler enforces
  - Implement `==`, `!=`, `Equals` and `GetHashCode` consistently for a class
  - Decide whether a conversion should be implicit or explicit, and write both
  - Explain what a C# 14 instance `operator +=` changes compared with a static `operator +`
---

## Outline

1. Operators are static methods
2. Equality done right
3. Implicit and explicit conversions
4. Compound assignment in C# 14

## Operators are static methods

When you write `a + b` and `a` is your own type, the compiler looks for a method declared as `public static Money operator +(Money left, Money right)` and calls it. Overloading an operator means writing such a method. The rules:

- It is `public static`, and at least one parameter has the containing type, so you can add operators to your own types only.
- Unary operators take one parameter, binary ones two, and the operand types may differ, as with `Money * decimal`. Each order of operands is a separate method.
- Comparison operators come in pairs: `==` with `!=`, `<` with `>`, `<=` with `>=`.
- `&&`, `||`, `=`, `.`, `?:`, `??` and `new` cannot be overloaded; indexing has its own syntax (indexers), and casts use conversion operators (below).

A **record struct** is a good home for a small value type with operators, because it already gets `==`, `!=`, `Equals` and `GetHashCode` from the compiler.

```csharp
var lunch = new Money(12.50m, "EUR");
var coffee = new Money(2.80m, "EUR");
Money bill = lunch + coffee * 2;
Console.WriteLine(bill);
Console.WriteLine(bill == new Money(18.10m, "EUR"));
Console.WriteLine(lunch > coffee);
try
{
    Console.WriteLine(lunch + new Money(3m, "USD"));
}
catch (InvalidOperationException e)
{
    Console.WriteLine(e.Message);
}

public readonly record struct Money(decimal Amount, string Currency) : IComparable<Money>
{
    public static Money operator +(Money left, Money right) =>
        new(left.Amount + right.Amount, SameCurrency(left, right));

    public static Money operator *(Money money, decimal factor) =>
        money with { Amount = money.Amount * factor };

    public static bool operator <(Money left, Money right) => left.CompareTo(right) < 0;
    public static bool operator >(Money left, Money right) => left.CompareTo(right) > 0;

    public int CompareTo(Money other)
    {
        SameCurrency(this, other);
        return Amount.CompareTo(other.Amount);
    }

    public override string ToString() => $"{Amount:0.00} {Currency}";

    private static string SameCurrency(Money a, Money b) =>
        a.Currency == b.Currency
            ? a.Currency
            : throw new InvalidOperationException($"cannot combine {a.Currency} with {b.Currency}");
}
```

```text
18.10 EUR
True
True
cannot combine EUR with USD
```

Normal precedence still applies (`*` before `+`), and `2 * coffee` would not compile until you add `operator *(decimal, Money)` as well. Operators return new values and leave their operands alone, just as `+` on `int` does.

## Equality done right

For a class, `==` compares **references** unless you overload it. If two `Sku` objects with the same code should be equal, five members must agree, because different parts of .NET use different ones: `==` and `!=` in your code, `Equals(object)` in `object` APIs, `IEquatable<T>.Equals` in generic collections, and `GetHashCode` in `Dictionary` and `HashSet`, which need equal objects to have equal hash codes. Defining only part of the set is caught:

```csharp
public sealed class Sku(string code)
{
    public string Code { get; } = code;

    public static bool operator ==(Sku? left, Sku? right) => left?.Code == right?.Code;
}
```

```text
error CS0216: The operator 'Sku.operator ==(Sku?, Sku?)' requires a matching operator '!=' to also be defined
warning CS0660: 'Sku' defines operator == or operator != but does not override Object.Equals(object o)
warning CS0661: 'Sku' defines operator == or operator != but does not override Object.GetHashCode()
```

The complete version, together with the conversions from the next section:

```csharp
var a = new Sku("bolt-m6");
var b = new Sku("BOLT-M6");
object boxed = b;
Console.WriteLine($"{a == b} {a != b} {a.Equals(boxed)} {ReferenceEquals(a, b)}");
Console.WriteLine(new HashSet<Sku> { a, b }.Count);
Console.WriteLine(a == null);

Percent vat = (Percent)25.0;
double gross = 40 * (1 + vat);
Console.WriteLine($"{vat} -> {gross}");
try
{
    Percent wrong = (Percent)250.0;
}
catch (ArgumentOutOfRangeException e)
{
    Console.WriteLine(e.ParamName);
}

public sealed class Sku(string code) : IEquatable<Sku>
{
    public string Code { get; } = code.ToUpperInvariant();

    public bool Equals(Sku? other) => other is not null && Code == other.Code;
    public override bool Equals(object? obj) => Equals(obj as Sku);
    public override int GetHashCode() => Code.GetHashCode();

    public static bool operator ==(Sku? left, Sku? right) =>
        left is null ? right is null : left.Equals(right);
    public static bool operator !=(Sku? left, Sku? right) => !(left == right);
}

public readonly struct Percent
{
    private readonly double _fraction;

    private Percent(double fraction) => _fraction = fraction;

    public static explicit operator Percent(double value)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(value, 0.0);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(value, 100.0);
        return new Percent(value / 100);
    }

    public static implicit operator double(Percent percent) => percent._fraction;

    public override string ToString() => $"{_fraction * 100}%";
}
```

```text
True False True False
1
False
25% -> 50
value
```

Everything funnels into one `Equals(Sku?)`, and `==` handles `null` on either side before calling it, so `a == null` is simply `false`. The hash code uses the same field as equality. Base equality on values that never change: a key whose hash changes while it sits in a `HashSet` can no longer be found.

## Implicit and explicit conversions

A **conversion operator** lets a value of one type be used as another. `implicit` conversions happen silently wherever needed; `explicit` ones require a cast. Choose by one rule: a conversion may be implicit only if it **always succeeds and loses no information**, like `int` to `long`. Anything that can fail or lose precision is explicit, like `double` to `int`.

`Percent` follows that rule. Every `Percent` is a valid `double`, so that direction is implicit, and `40 * (1 + vat)` works without a cast. Not every `double` is a valid percentage, so the other direction is explicit and validates its input. Leave out the cast and the compiler says:

```text
error CS0266: Cannot implicitly convert type 'double' to 'Percent'. An explicit conversion exists (are you missing a cast?)
```

Use conversions sparingly: an implicit call is invisible, and a named method such as `Percent.FromNumber(25)` is often clearer. Note also that `is` and `as` ignore user-defined conversions; only a cast or an assignment invokes them.

## Compound assignment in C# 14

Until C# 13, `x += y` always meant `x = x + y`: compute a new value with the static `+` and store it back in the variable. For a large mutable object, such as a buffer or a matrix, that builds a whole new object on every `+=`. C# 14 lets a type declare **compound assignment operators** as instance methods: `public void operator +=(int more)`, with no `static`, one parameter, a `void` result, and the job of changing `this`. When `x` is a variable and the type has such an operator, `x += y` calls it; otherwise the static operator is used as before. `++` and `--` can be instance operators in the same way.

```csharp
var votes = new Tally("north");
Tally before = votes;
votes += 5; // instance operator +=: changes this object
votes += 2;
Console.WriteLine($"{votes.Count}, same object: {ReferenceEquals(before, votes)}");

Tally copy = votes + 1; // static operator +: builds a new object
Console.WriteLine($"{copy.Count} {votes.Count}, same object: {ReferenceEquals(copy, votes)}");

public sealed class Tally(string name)
{
    public string Name { get; } = name;
    public int Count { get; private set; }

    public static Tally operator +(Tally tally, int more) =>
        new(tally.Name) { Count = tally.Count + more };

    public void operator +=(int more) => Count += more;
}
```

```text
7, same object: True
8 7, same object: False
```

`before` saw the change, because `+=` updated the shared object instead of replacing the variable's reference. That is the point for performance and also the risk: anyone holding a reference sees the change. Keep instance compound operators for types that are meant to be mutable.

Whatever you overload, make it mean what it means for numbers: `+` on `Money` adds, it does not send an email, and it throws for nonsense such as mixed currencies.

## Common mistakes

- **Overloading `==` without `!=`, `Equals` and `GetHashCode`.**
- **`==` that dereferences a `null` operand.**
- **Implicit conversions that can throw or lose data.**
- **Assuming `x += y` creates a new object** on a C# 14 type that defines `operator +=`.

## Practice

1. Add `operator *(decimal factor, Money money)` so `2 * coffee` compiles.
2. Delete the `operator +=` from `Tally`. What does the example print now?
3. Should a conversion from `Celsius` to `Fahrenheit` (two `double` wrappers) be implicit or explicit?

### Answers

1. Reuse the existing one: `public static Money operator *(decimal factor, Money money) => money * factor;`
2. `7, same object: False` and then `8 7, same object: False`. Without the instance operator, `votes += 5` means `votes = votes + 5`, which builds a new `Tally`, so `before` keeps the old object with a count of 0.
3. It always succeeds, but rounding can lose a little precision, and a temperature silently changing scale is surprising. An explicit conversion, or a named `ToFahrenheit()` method, is the safer choice.

## Key takeaways

- Operators are `public static` methods; comparison operators come in pairs.
- For a class with value equality, keep `==`, `!=`, both `Equals` and `GetHashCode` consistent; records do it for you.
- Implicit conversions must never fail or lose information; everything else is explicit.
- C# 14 instance `operator +=` updates the object in place, and `x += y` prefers it.

## Further reading

- [Microsoft Learn: Operator overloading](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/operator-overloading)
- [Microsoft Learn: User-defined explicit and implicit conversion operators](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/user-defined-conversion-operators)
- [Microsoft Learn: What's new in C# 14](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14)
