---
title: Attributes and Reflection
summary: Attach metadata to code with built-in and custom attributes, read it at run time with reflection, let the compiler fill in caller details with caller information attributes and `nameof`, and weigh what reflection costs.
minutes: 30
objectives:
  - Apply built-in attributes such as `[Obsolete]` and predict the diagnostics they cause
  - Write a custom attribute with `AttributeUsage`, positional and named arguments
  - Read attributes and property values at run time with `Type`, `PropertyInfo` and `GetCustomAttribute<T>`
  - Use `CallerMemberName`, `CallerLineNumber`, `CallerArgumentExpression` and `nameof`, and explain why reflection should be used sparingly
---

## Outline

1. What an attribute is
2. Attributes the compiler reads
3. Writing your own attribute
4. Reading attributes with reflection
5. Caller information and `nameof`
6. The cost of reflection

## What an attribute is

Every compiled .NET assembly carries **metadata**: a description of its types, their members, parameters and so on. An **attribute** adds your own facts to that description. It is written in square brackets before a declaration, `[Obsolete]`, and it is a class deriving from `System.Attribute`, whose name ends in `Attribute` by convention. You may leave the suffix off when you apply it.

An attribute does nothing by itself. It is a label, and only code that reads labels gives it meaning. That reader is either the **compiler** (for a few attributes it knows) or a program running **reflection**, the API for inspecting types and members at run time. Test frameworks find tests through `[Fact]` or `[Test]`, serializers read `[JsonPropertyName]`, and ASP.NET Core reads `[HttpGet]`.

## Attributes the compiler reads

`[Obsolete]` marks something that should no longer be used. Every use produces a warning, or an error if you pass `error: true`, so you can retire an API in two stages.

```csharp
Pricing.Gross(10m);
Pricing.GrossOld(10m);

static class Pricing
{
    [System.Obsolete("Use Gross(net, rate) so the tax rate is explicit.")]
    public static decimal Gross(decimal net) => net * 1.2m;

    [System.Obsolete("Removed in version 3.", error: true)]
    public static decimal GrossOld(decimal net) => net * 1.2m;
}
```

```text
warning CS0618: 'Pricing.Gross(decimal)' is obsolete: 'Use Gross(net, rate) so the tax rate is explicit.'
error CS0619: 'Pricing.GrossOld(decimal)' is obsolete: 'Removed in version 3.'
```

Others you have met or will meet: `[Flags]` on enums, `[EnumeratorCancellation]` from lesson 4, `[MethodImpl]` from lesson 6, and the caller information attributes below.

## Writing your own attribute

A custom attribute is a class that derives from `Attribute`. Mark it with `[AttributeUsage]` to say where it may be applied (`AttributeTargets.Property`, `Class`, `Method` and so on), whether it may appear more than once on one target (`AllowMultiple`, default `false`), and whether derived classes inherit it (`Inherited`, default `true`).

When you apply it, **positional** arguments go to its constructor and must come first, in order. **Named** arguments set its public properties and are optional: `[Between(0.1, 2500, Unit = "kg")]`. All arguments must be known at compile time, because they are stored in the metadata: constants, `typeof(...)` expressions, enum values, and arrays of these.

## Reading attributes with reflection

Reflection starts from a `Type` object: `typeof(Shipment)` when you know the type, `obj.GetType()` when you have an object. From it you can list members (`GetProperties()`, `GetMethods()`), read and write values (`PropertyInfo.GetValue`, `SetValue`), call methods, create instances, and fetch attributes with `GetCustomAttribute<T>()`, which builds the attribute object from its metadata or returns `null` when there is none.

Here is a small validator that works for any class, driven entirely by attributes:

```csharp
var good = new Shipment { Reference = "SHP-001", Weight = 12 };
var bad = new Shipment { Reference = "", Weight = 4000 };
Console.WriteLine($"good: {Validator.Check(good).Count} problems");
foreach (string problem in Validator.Check(bad))
    Console.WriteLine($"bad: {problem}");

[AttributeUsage(AttributeTargets.Property)]
sealed class RequiredAttribute : Attribute { }

[AttributeUsage(AttributeTargets.Property)]
sealed class BetweenAttribute(double min, double max) : Attribute
{
    public double Min { get; } = min;
    public double Max { get; } = max;
    public string Unit { get; set; } = "";
}

sealed class Shipment
{
    [Required]
    public string Reference { get; set; } = "";

    [Between(0.1, 2500, Unit = "kg")]
    public double Weight { get; set; }
}

static class Validator
{
    public static List<string> Check(object target)
    {
        var problems = new List<string>();
        foreach (PropertyInfo property in target.GetType().GetProperties().OrderBy(p => p.Name))
        {
            object? value = property.GetValue(target);
            if (property.GetCustomAttribute<RequiredAttribute>() is not null && value is null or "")
                problems.Add($"{property.Name} is required");
            if (property.GetCustomAttribute<BetweenAttribute>() is { } limits
                && value is double number && (number < limits.Min || number > limits.Max))
                problems.Add($"{property.Name} must be {limits.Min} to {limits.Max} {limits.Unit}");
        }
        return problems;
    }
}
```

```text
good: 0 problems
bad: Reference is required
bad: Weight must be 0.1 to 2500 kg
```

(It needs `using System.Reflection;` and `using System.Linq;`.) `GetProperties()` does not promise any particular order, so the validator sorts by name to make its output stable. Adding a rule to `Shipment` is now one line, with no change to `Validator`.

## Caller information and `nameof`

Some attributes are read by the compiler *at the call site*. Put one on an optional parameter, and when a caller leaves that argument out, the compiler fills in a fact about the call as a constant:

- `[CallerMemberName]`: the calling method or property's name.
- `[CallerLineNumber]` and `[CallerFilePath]`: where the call is.
- `[CallerArgumentExpression("param")]`: the source text of the argument passed for `param`.

```csharp
using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;

Dock.Load(pallets: 0, bay: "B4");
Console.WriteLine($"{nameof(Dock.Load)} {nameof(List<>)} {nameof(Dictionary<,>)} {nameof(Console.Out)}");

static class Dock
{
    public static void Load(int pallets, string bay)
    {
        Check.That(pallets > 0);
        Check.That(bay.StartsWith('D'));
    }
}

static class Check
{
    public static void That(
        bool condition,
        [CallerArgumentExpression(nameof(condition))] string expression = "",
        [CallerMemberName] string caller = "",
        [CallerLineNumber] int line = 0)
    {
        if (!condition)
            Console.WriteLine($"failed in {caller}, line {line}: {expression}");
    }
}
```

```text
failed in Load, line 12: pallets > 0
failed in Load, line 13: bay.StartsWith('D')
Load List Dictionary Out
```

No reflection and no stack walking happen at run time: the values were compiled into each call. That is how `ArgumentNullException.ThrowIfNull(x)` knows the name `x`, and how logging and property-change notifications get the member name without typing it.

`nameof(...)` is the same idea for names you refer to yourself: it turns a symbol into its name as a string at compile time, and a rename in the editor updates it. Since C# 14 it accepts **unbound generic types** such as `nameof(List<>)`; before, you had to write a closed type such as `List<int>`.

## The cost of reflection

Reflection is powerful and expensive:

- **Speed.** Looking members up by name and calling them through `PropertyInfo.GetValue` or `MethodInfo.Invoke` is much slower than a direct call. Look things up once and cache the results instead of reflecting inside a hot loop.
- **Safety.** Mistakes the compiler would catch, a misspelled member name or a wrong argument type, become run-time exceptions.
- **Deployment.** When an app is trimmed or published with Native AOT, members that are used only through reflection may be removed, and the build tools warn about reflection they cannot analyze.

So read your own attributes at startup, or once per type, and keep the results. Libraries increasingly move this work to compile time with **source generators**, which read attributes while the program is being compiled and write ordinary C#. `System.Text.Json` offers both styles.

## Common mistakes

- **Expecting an attribute to do something on its own.** Without a reader it is inert.
- **Passing a non-constant attribute argument**, such as a variable or `DateTime.Now`, which is a compile error.
- **Relying on the order of `GetProperties()` or `GetMethods()`.**
- **Reflecting on every call** in performance-sensitive code.

## Practice

1. Add a `[MaxLength(10)]` attribute for string properties and teach `Validator` to check it.
2. Why is `Check.That(order.Lines.Count > 0)` more useful in a log than `Check.That(false)`?
3. What do `nameof(Shipment.Weight)` and `nameof(Validator.Check)` evaluate to?

### Answers

1. Declare the attribute and add one rule to the loop:

   ```csharp
   [AttributeUsage(AttributeTargets.Property)]
   sealed class MaxLengthAttribute(int length) : Attribute
   {
       public int Length { get; } = length;
   }

   // inside the foreach in Validator.Check:
   if (property.GetCustomAttribute<MaxLengthAttribute>() is { } max
       && value is string text && text.Length > max.Length)
       problems.Add($"{property.Name} is longer than {max.Length}");
   ```

2. `CallerArgumentExpression` records the condition's source text, so the first prints `order.Lines.Count > 0` and tells you exactly what failed; the second can only print `false`.
3. `"Weight"` and `"Check"`. `nameof` gives the last name in the expression, without its type or class.

## Key takeaways

- An attribute is metadata; the compiler or reflection must read it to give it meaning.
- `AttributeUsage` controls targets; constructor arguments are positional, properties are named.
- Reflection reads types, members, values and attributes at run time through `Type` and `PropertyInfo`.
- Caller information attributes and `nameof` are filled in at compile time and cost nothing at run time.
- Reflection is slow, unchecked and unfriendly to trimming: cache it, or generate code at compile time.

## Further reading

- [Microsoft Learn: Attributes and reflection](https://learn.microsoft.com/en-us/dotnet/csharp/advanced-topics/reflection-and-attributes/)
- [Microsoft Learn: Caller information attributes](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/attributes/caller-information)
- [Microsoft Learn: What's new in C# 14 (nameof with unbound generic types)](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14)
