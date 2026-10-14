---
title: Extension Methods and Extension Members
summary: Add methods, properties, static members and operators to types you cannot change, with classic extension methods and the extension blocks of C# 14, and see how LINQ is built from them.
minutes: 25
objectives:
  - Write a classic extension method with `this` and call it with instance syntax
  - Predict which method a call binds to when the type and an extension declare the same member
  - Declare an extension block with instance methods, extension properties and static extension members
  - Decide when an extension is the right tool and when a method on the type itself is better
---

## Outline

1. Adding members to types you do not own
2. Classic extension methods
3. How extension calls bind
4. Extension blocks in C# 14
5. LINQ is made of extensions
6. When to use extensions

## Adding members to types you do not own

You often want a small helper on a type you cannot edit: `string` and `TimeSpan` belong to .NET,
and a type from a library belongs to its authors. You could write a static helper class and call
`TextHelpers.Truncate(title, 10)`, but it reads backwards and nobody finds it. An **extension
member** is a static method or property, declared in a static class, that you call *as if* it were
a member of another type: `title.Truncate(10)`. The extended type is not modified at all; the
compiler rewrites the call.

## Classic extension methods

Since C# 3, an extension method is a `static` method in a **non-generic, non-nested `static`
class** whose first parameter is marked with `this`. That parameter, the **receiver**, says which
type the method extends.

```csharp
using Shop.Text;

string title = "Persuasion and Other Stories";
Console.WriteLine(title.Truncate(10));
Console.WriteLine("Dune".Truncate(10));
Console.WriteLine(TextExtensions.Truncate(title, 7));   // what the compiler really calls

string? missing = null;
Console.WriteLine($"[{missing.OrEmpty()}]");            // no NullReferenceException

namespace Shop.Text
{
    public static class TextExtensions
    {
        public static string Truncate(this string text, int max) =>
            text.Length <= max ? text : text.Substring(0, max - 3) + "...";

        public static string OrEmpty(this string? text) => text ?? "";
    }
}
```

```text
Persuas...
Dune
Pers...
[]
```

- The extension is visible only where its **namespace** is imported with `using`. That is why LINQ
  needs `using System.Linq;`, which a console project imports for you.
- `title.Truncate(10)` is compiled to `TextExtensions.Truncate(title, 10)`. Because it is a static
  call, calling an extension on `null` does not throw by itself; `OrEmpty` relies on that. Most
  extensions should still treat `null` as a caller error.
- An extension sees only the extended type's *accessible* members. It cannot reach private fields,
  so it cannot break encapsulation.

Forget `static` on the class and the compiler refuses:

```text
error CS1106: Extension method must be defined in a non-generic static class
```

## How extension calls bind

When you write `x.Name(...)`, the compiler first looks for a matching member on the type of `x`.
Only if there is none does it search the extensions in scope. An extension can therefore *add*
behaviour but never *replace* it:

```csharp
var pad = new Notepad();
pad.Save();    // the type's own method wins
pad.Print();   // only the extension exists

class Notepad
{
    public void Save() => Console.WriteLine("Notepad.Save");
}

static class NotepadExtensions
{
    public static void Save(this Notepad pad) => Console.WriteLine("extension Save");
    public static void Print(this Notepad pad) => Console.WriteLine("extension Print");
}
```

```text
Notepad.Save
extension Print
```

The extension `Save` is silently ignored. The same thing happens later if a library you extend adds
a method with your extension's name: your calls quietly switch to the library's version. Choose
specific names.

## Extension blocks in C# 14

C# 14 adds a second syntax, the **extension block**: inside a static class, `extension(Type name)`
opens a block, and every member in it extends that type. The receiver is declared once instead of
on every method. More importantly, a block can hold members that the `this` syntax never could:

- **extension properties**, read like any property;
- **static extension members**, called on the type itself, declared in a block whose receiver has no
  name;
- **operators**, such as `+` for a type you do not own.

```csharp
string[] lines = ["alpha", "", "beta"];
Console.WriteLine($"{lines.IsEmpty} {new List<int>().IsEmpty}");
Console.WriteLine(string.Join(",", lines.WhereNot(string.IsNullOrEmpty)));
Console.WriteLine($"{"   ".IsBlank} {"x".IsBlank}");

TimeSpan shift = TimeSpan.FromWorkDays(2);   // a static extension member
Console.WriteLine(shift);

public static class HelpfulExtensions
{
    extension<T>(IEnumerable<T> source)      // instance members for any sequence
    {
        public bool IsEmpty => !source.Any();

        public IEnumerable<T> WhereNot(Func<T, bool> predicate) =>
            source.Where(item => !predicate(item));
    }

    extension(string text)
    {
        public bool IsBlank => string.IsNullOrWhiteSpace(text);
    }

    extension(TimeSpan)                       // no receiver name: static members only
    {
        public static TimeSpan FromWorkDays(int days) => TimeSpan.FromHours(8 * days);
    }
}
```

```text
False True
alpha,beta
True False
16:00:00
```

- `extension<T>(IEnumerable<T> source)` is generic, so its members work on arrays, lists and every
  other sequence. A type parameter used by the receiver goes on the block; one used only by a
  member goes on that member.
- `IsEmpty` and `IsBlank` are extension properties: no parentheses at the call site.
- `TimeSpan.FromWorkDays(2)` reads exactly like the built-in `TimeSpan.FromHours`.
- The blocks compile to the same code as `this` methods, so callers cannot tell which syntax you
  used, and existing extension methods can be converted without breaking anyone.

A receiver of a value type is a copy, as any argument is (lesson 2). `extension(int number)` with a
method that does `number++` changes only that copy; declare `extension(ref int number)` to change
the caller's variable.

## LINQ is made of extensions

Now the mystery of lessons 10 and 11 is solved. `IEnumerable<T>` declares just one method,
`GetEnumerator`. `Where`, `Select`, `OrderBy`, `Count` and the rest are extension methods in the
static class `System.Linq.Enumerable`, which is why every array, list and set has them and why they
appear only after `using System.Linq;`. Your own extensions on `IEnumerable<T>`, like `WhereNot`
above, sit beside them and chain in the same way.

## When to use extensions

Extensions are the right tool when you cannot change the type, when the behaviour belongs to a
particular layer of your program (formatting for one screen, for example) rather than to the type
everywhere, or when one helper should serve every implementation of an interface. When you own the
type and the behaviour is part of what it is, add a real member instead: it can use private state,
it shows up in the type's own documentation, and it cannot be shadowed.

## Common mistakes

- **Expecting an extension to override.** A member of the type always wins, silently.
- **Forgetting the `using`.** The extension seems to vanish: error CS1061, "does not contain a
  definition".
- **Modifying a value-type receiver.** Without `ref`, the change is made to a copy.
- **Extending `object` or `string` with domain logic.** Every string in the program gains the
  member. Extend the narrowest type that makes sense.

## Practice

1. Write a classic extension `static bool IsWeekend(this DateOnly date)`.
2. Rewrite it as an extension property in an extension block, and call it.
3. A class `Report` gains a method `Print()` in a new library version, and your project already has
   an extension `Print(this Report r)`. Which one runs after the upgrade?

### Answers

1. `public static bool IsWeekend(this DateOnly date) => date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;`
   inside a `public static class`.
2. `extension(DateOnly date) { public bool IsWeekend => date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday; }`
   inside a static class. Call it as `new DateOnly(2026, 10, 17).IsWeekend`, which is `True`.
3. The library's `Report.Print()`. Members of the type are always chosen before extensions, so your
   extension is now never called.

## Key takeaways

- An extension member is a static member called with instance (or type) syntax; the extended type
  is unchanged and private members stay private.
- The type's own members always win over extensions, and extensions are in scope only where their
  namespace is imported.
- C# 14 extension blocks add extension properties, static extension members and operators, and
  compile to the same code as `this` methods.
- LINQ's operators are extension methods on `IEnumerable<T>`.

## Further reading

- [Extension members (C# programming guide)](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/extension-methods)
- [C# reference: Extension member declarations](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/extension)
- [What's new in C# 14](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14)
