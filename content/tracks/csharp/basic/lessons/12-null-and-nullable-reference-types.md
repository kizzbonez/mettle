---
title: Null and Nullable Reference Types
summary: Understand null, give value types a missing value with int?, let the compiler warn about possible null references, and handle null safely with checks, ?., ?? and ??= instead of the ! operator.
minutes: 30
objectives:
  - Explain what `null` is, which types can hold it, and what `NullReferenceException` means
  - Use nullable value types such as `int?` with `HasValue`, `Value`, `??` and `GetValueOrDefault`
  - Read the nullable warnings CS8600, CS8602, CS8603 and CS8618 and fix the code behind them
  - Handle possible nulls with `is null` checks, `?.`, `??` and `??=`, and explain why `!` should be rare
---

## Outline

1. What `null` means
2. Value types: `int?`
3. Reference types and `NullReferenceException`
4. Nullable reference types
5. Checking for `null`
6. `?.`, `??` and `??=`
7. The `!` operator
8. Where `null` comes from

## What `null` means

`null` means "no value here". A variable of a **reference type**, such as `string`, an array, a
list or one of your classes, holds a reference to an object, and `null` is the reference that
points to nothing. Many things legitimately have no value: a customer without a middle name, a
lookup that found nothing, input that has ended. The trouble starts when code uses a `null` as
if it were an object.

## Value types: `int?`

`int`, `double`, `bool`, `char` and `decimal` are **value types**: the variable holds the value
itself, so it always holds *some* value. `int seats = null;` is error CS0037, "Cannot convert
null to 'int' because it is a non-nullable value type". To allow "no value", add `?`:

```csharp
int? rating = null;
Console.WriteLine(rating.HasValue);
Console.WriteLine(rating ?? 0);
Console.WriteLine(rating.GetValueOrDefault());
rating = 4;
Console.WriteLine($"{rating.HasValue} {rating.Value}");
int? missing = null;
int? sum = rating + missing;
Console.WriteLine(sum is null);
Console.WriteLine(rating > missing);
```

```text
False
0
0
True 4
True
False
```

- `HasValue` tells whether there is a value, and `Value` reads it. Reading `Value` when there is
  none throws `InvalidOperationException`: "Nullable object must have a value."
- `rating ?? 0` gives the value, or 0 when there is none. `GetValueOrDefault()` does the same
  with the type's default.
- Arithmetic with a `null` operand gives `null`, and a comparison such as `>` with a `null`
  operand gives `false`.

An `int?` does not convert to an `int` by itself: `int stars = rating;` is error CS0266, because
the compiler cannot know what to do with `null`. Use `??` to say.

## Reference types and `NullReferenceException`

Using a member of a `null` reference, such as `.Length` on a missing string, throws a
`NullReferenceException`. Before C# 8 the compiler said nothing about it. Today it warns:

```csharp
string? nickname = null;
Console.WriteLine(nickname.Length);
```

```text
Program.cs(2,19): warning CS8602: Dereference of a possibly null reference.
Unhandled exception. System.NullReferenceException: Object reference not set to an instance of an object.
   at Program.<Main>$(String[] args) in /home/ada/members/Program.cs:line 2
```

To **dereference** a reference is to use the object it points to: call a method, read a
property, or index into it. The first line is a compiler warning, not an error, so the program
built and then crashed exactly where the warning pointed.

## Nullable reference types

Since C# 8, and on by default in new projects through `<Nullable>enable</Nullable>` (lesson 2),
the compiler tracks which references may be `null`:

- `string` declares that the variable should **never** be `null`.
- `string?` declares that `null` is an allowed value, so it must be checked before use.

The annotation changes nothing at run time. Both are the same `System.String`. It is a promise
the compiler checks, and breaking it produces **warnings**:

```csharp
string? nickname = null;
string display = nickname;
Console.WriteLine(Greet(display));

static string Greet(string? name)
{
    return name;
}
```

```text
Program.cs(2,18): warning CS8600: Converting null literal or possible null value to non-nullable type.
Program.cs(7,12): warning CS8603: Possible null reference return.
```

The program builds and prints an empty line, because `Console.WriteLine` prints nothing for a
`null` string. Here that is harmless, but the very next `.Length` would crash.

| Warning | Meaning |
| --- | --- |
| CS8600 | a value that may be `null` is stored in a non-nullable variable |
| CS8602 | a reference that may be `null` is dereferenced |
| CS8603 | a method that promises a non-nullable result may return `null` |
| CS8618 | a non-nullable field or property is not set by the constructor |
| CS8625 | the literal `null` is passed where `null` is not allowed |

Treat every one of these as a bug report. Each points at a place where the program can crash
with `NullReferenceException`.

## Checking for `null`

The compiler follows your checks. After a test for `null`, it knows which branch holds a real
object, and the warning goes away:

```csharp
string? nickname = FindNickname("ada");
if (nickname is not null)
{
    Console.WriteLine(nickname.ToUpper());
}
string? other = FindNickname("bob");
Console.WriteLine(other?.ToUpper());
Console.WriteLine(other ?? "(no nickname)");
int length = other?.Length ?? 0;
Console.WriteLine(length);
other ??= "Bobby";
Console.WriteLine(other);

static string? FindNickname(string user) => user == "ada" ? "Countess" : null;
```

```text
COUNTESS

(no nickname)
0
Bobby
```

`is null` and `is not null` are the clearest tests. `== null` and `!= null` also work.
`FindNickname` returns `string?`, which tells every caller "check the result". It is a local
function as in lesson 8. `static` there means it uses nothing but its own parameters.

## `?.`, `??` and `??=`

- **`a?.Member`** is the *null-conditional* operator. When `a` is `null`, the whole expression is
  `null` instead of throwing. That is why the second line of output is empty:
  `Console.WriteLine(null)` prints an empty line.
- **`a ?? b`** is the *null-coalescing* operator: `a` if it is not `null`, otherwise `b`. The
  right side is only evaluated when needed.
- **`a ??= b`** assigns `b` to `a` only when `a` is `null`.

They combine well: `other?.Length ?? 0` is "the length, or 0 if there is no string".

## The `!` operator

Writing `!` after an expression, the *null-forgiving* operator, tells the compiler "trust me,
this is not `null`" and silences the warning. It does nothing at run time:

```csharp
string? nickname = FindNickname("bob");
Console.WriteLine(nickname!.Length);

static string? FindNickname(string user) => user == "ada" ? "Countess" : null;
```

```text
Unhandled exception. System.NullReferenceException: Object reference not set to an instance of an object.
   at Program.<Main>$(String[] args) in /home/ada/members/Program.cs:line 2
```

No warning appeared, and the program crashed anyway. Every `!` is a place where the compiler can
no longer protect you. Prefer a check, a `??` with a sensible default, or a better type. Keep
`!` for the rare case where you know more than the compiler, and could explain why in a comment.

## Where `null` comes from

- **Missing initialization.** A non-nullable property that the constructor does not set starts
  as `null`, and the compiler warns with CS8618, "Non-nullable property 'Email' must contain a
  non-null value when exiting constructor". Set it in the constructor, give it a starting value
  such as `= ""`, or declare it `string?` if "no email" is a real possibility.
- **Arrays.** `new string[3]` holds three `null`s, as lesson 9 showed.
- **Library methods.** `Console.ReadLine()` returns `string?`: it gives `null` when there is no
  more input, as lesson 14 shows. `TryGetValue` on a dictionary of strings uses `out string?`,
  and the compiler knows the value is not `null` in the branch where it returned `true`.

## Common mistakes

- **Ignoring nullable warnings.** They compile, then crash. Fix each one.
- **Silencing warnings with `!`.** The crash moves, it does not go away.
- **Reading `.Value` on an empty `int?`.** Use `??` or check `HasValue` first.
- **Making everything `string?`.** Use `?` only where "no value" is meaningful. Non-nullable
  types are what let the compiler help you.
- **Assuming `?.` prevents every crash.** `a?.B.C` still throws if `B` returns `null`. Use `?.`
  at each step that can be `null`.

## Practice

1. Write `Initials(string? first, string? last)` that returns the first letter of each name,
   using `?` for a name that is `null` or empty. Test it with `("Ada", "Lovelace")`,
   `(null, "Hopper")` and `("", null)`.
2. Two `int?` scores may each be missing. Print their sum, counting a missing score as 0.
3. A `List<string>? cache` starts as `null`. Make it an empty list only if it is `null`, then add
   one item and print the count, in two lines of code.

### Answers

```csharp
Console.WriteLine(Initials("Ada", "Lovelace"));
Console.WriteLine(Initials(null, "Hopper"));
Console.WriteLine(Initials("", null));
int? a = 3;
int? b = null;
Console.WriteLine((a ?? 0) + (b ?? 0));
List<string>? cache = null;
cache ??= [];
cache.Add("x");
Console.WriteLine(cache.Count);

static string Initials(string? first, string? last)
{
    string f = string.IsNullOrEmpty(first) ? "?" : first.Substring(0, 1);
    string l = string.IsNullOrEmpty(last) ? "?" : last.Substring(0, 1);
    return f + l;
}
```

```text
AL
?H
??
3
1
```

`string.IsNullOrEmpty` checks both cases in one call, and the compiler understands that `first`
is not `null` after it returns `false`. `a + b` alone would be `null`, so each score gets its own
`??`. After `??=`, the compiler knows `cache` is not `null`.

## Key takeaways

- `null` means "no value". Value types need `?` to hold it, and reference types can always hold it
  at run time.
- With nullable reference types on, `string` promises "never null" and `string?` says "check
  first". The warnings point at future `NullReferenceException`s.
- Check with `is null` and `is not null`, and use `?.`, `??` and `??=` for concise handling.
- `!` silences the compiler without making anything safer. Use it rarely.

## Further reading

- [Microsoft Learn: Nullable reference types](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/null-safety/nullable-reference-types)
- [Microsoft Learn: Nullable value types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/nullable-value-types)
- [Microsoft Learn: The ?? and ??= operators](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/null-coalescing-operator)
