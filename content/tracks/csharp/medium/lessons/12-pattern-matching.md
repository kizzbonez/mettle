---
title: Pattern Matching
summary: Test the type, value and shape of data in one expression with type, property, positional, relational, logical and list patterns, and compute results with exhaustive switch expressions.
minutes: 30
objectives:
  - Test a value's run-time type and name the result with `is` and declaration patterns
  - Write switch expressions with relational and logical patterns, case guards and a discard arm
  - Match nested data with property, extended property and positional patterns
  - Match arrays and lists by length and content with list and slice patterns, and read warning CS8509
---

## Outline

1. Patterns, `is` and switch expressions
2. Type patterns
3. Relational and logical patterns
4. Property and positional patterns
5. List patterns
6. Exhaustiveness

## Patterns, `is` and switch expressions

A **pattern** describes a condition on a value's type, value or shape, and can give names to the
parts it finds. Patterns appear in three places: after `is` (`if (x is ...)`), in the `case` labels
of a `switch` statement, and in the arms of a **switch expression**. A switch expression is
written `input switch { pattern => result, ... }`. It is an expression, so it produces a value; the
**arms** are tried from top to bottom, and the first one whose pattern matches gives the result.
An arm may add a **case guard**, `when condition`, which must also be true. The **discard
pattern** `_` matches anything and is the usual last arm.

## Type patterns

A **declaration pattern** such as `string s` checks that a value's run-time type is `string` (or
derives from it, or implements it) and, if so, gives you a variable `s` of that type. It never
matches `null`. A **type pattern** is the same test without a name: just `string`. These replace the
risky casts of lesson 3.

```csharp
object?[] inputs = [42, -7, "hello", "", 3.5, null, new List<int> { 1, 2 }];
foreach (object? input in inputs)
{
    Console.WriteLine(Describe(input));
}

object box = "pattern";
if (box is string text && text.Length > 3)
{
    Console.WriteLine($"long string: {text.ToUpper()}");
}

static string Describe(object? value) => value switch
{
    null => "nothing",
    int n when n < 0 => "a negative int",
    int n => $"the int {n}",
    string { Length: 0 } => "an empty string",
    string s => $"a string of {s.Length} chars",
    IList<int> list => $"a list of {list.Count} ints",
    _ => $"something else: {value.GetType().Name}",
};
```

```text
the int 42
a negative int
a string of 5 chars
an empty string
something else: Double
nothing
a list of 2 ints
long string: PATTERN
```

`null` is a **constant pattern**, like `0` or `"help"`: it matches values equal to that constant.
`x is null` and `x is not null` are the clearest null tests in C#. Order matters: the guarded
`int n when n < 0` must come before the plain `int n`. If an arm can never be reached because an
earlier one matches everything it would, the compiler reports error CS8510.

## Relational and logical patterns

**Relational patterns** compare with a constant: `< 0`, `>= 15`. **Logical patterns** combine
patterns with `and`, `or` and `not`. Parentheses group them.

```csharp
foreach (double c in new[] { -5.0, 0, 18.5, 31, double.NaN })
{
    Console.Write($"{c}: {Classify(c)}  ");
}
Console.WriteLine();
Console.WriteLine($"{IsVowel('e')} {IsVowel('z')} {IsNotDigit('7')} {IsNotDigit('q')}");

static string Classify(double celsius) => celsius switch
{
    < 0 => "freezing",
    >= 0 and < 15 => "cold",
    >= 15 and < 30 => "mild",
    >= 30 => "hot",
    _ => "not a number",   // NaN fails every comparison
};

static bool IsVowel(char c) => c is 'a' or 'e' or 'i' or 'o' or 'u';
static bool IsNotDigit(char c) => c is not (>= '0' and <= '9');
```

```text
-5: freezing  0: cold  18.5: mild  31: hot  NaN: not a number  
True False False True
```

`not` binds more tightly than `and`, and `and` more tightly than `or`. Without parentheses,
`c is not >= '0' and <= '9'` means `(not >= '0') and <= '9'`, which is false for `'q'` and every
other letter: a classic bug. The .NET 10 compiler hints at it with warning CS9336, "The pattern
is redundant." When combining `not` with anything, add parentheses.

## Property and positional patterns

A **property pattern** `{ Name: pattern, ... }` matches when the value is not null and each listed
property matches its own pattern. Patterns nest, and an **extended property pattern** reaches into
a nested property with a dot: `{ Address.Country: "UK" }`. A **positional pattern** `( ... )`
deconstructs the value (lesson 1) and matches each part in order; positional records and tuples
support it automatically.

```csharp
Order[] orders =
[
    new Order("ada", new Address("UK", "London"), 120m),
    new Order("bo", new Address("UK", "Leeds"), 30m),
    new Order("cy", new Address("FR", "Paris"), 80m),
    new Order("dee", new Address("US", "Austin"), 500m),
    new Order("eli", new Address("US", "Boise"), 60m),
];
foreach (Order order in orders)
{
    Console.Write($"{order.Customer}={Shipping(order)} ");
}
Console.WriteLine();

static decimal Shipping(Order order) => order switch
{
    { Address.Country: "UK", Total: >= 100m } => 0m,          // property patterns
    { Address.Country: "UK" } => 4.99m,
    { Address: { Country: "FR" or "DE" } } => 9.99m,
    (_, ("US", _), > 400m) => 0m,                              // positional pattern
    _ => 24.99m,
};

record Address(string Country, string City);
record Order(string Customer, Address Address, decimal Total);
```

```text
ada=0 bo=4.99 cy=9.99 dee=0 eli=24.99 
```

The whole pricing policy reads as a table. Property patterns say which property they test, so they
stay clear as types grow; positional patterns are shorter but depend on parameter order, so keep
them for small types such as points and tuples. Matching a tuple, `(a, b) switch { ... }`, is a
neat way to branch on two values at once.

## List patterns

A **list pattern** `[ ... ]` matches an array or list element by element, and therefore also by
length. Inside it, the **slice pattern** `..` matches any number of elements (zero or more), at
most once per list pattern, and `.. var rest` captures them.

```csharp
string[][] commands =
[
    ["help"],
    ["add", "milk"],
    ["add", "eggs", "bread", "jam"],
    ["remove", "3"],
    ["remove", "three"],
    [],
];
foreach (string[] words in commands)
{
    Console.WriteLine(Run(words));
}

static string Run(string[] words) => words switch
{
    [] => "no command",
    ["help"] => "usage: add ITEM..., remove N",
    ["add", var item] => $"added {item}",
    ["add", var first, .. var rest] => $"added {first} and {rest.Length} more",
    ["remove", var n] when int.TryParse(n, out int index) => $"removed item {index}",
    [var verb, ..] => $"cannot understand '{verb}'",
};
```

```text
usage: add ITEM..., remove N
added milk
added eggs and 2 more
removed item 3
cannot understand 'remove'
no command
```

A **var pattern** such as `var item` matches anything and names it. This is how command-line
arguments, tokens and fixed-format records are often parsed: each arm states one accepted shape.

## Exhaustiveness

A switch expression must produce a value for *every* input. If the compiler can find an input no
arm matches, it warns, and at run time that input throws:

```csharp
Console.WriteLine(Grade(75));
Console.WriteLine(Grade(120));

static string Grade(int score) => score switch
{
    >= 90 and <= 100 => "distinction",
    >= 50 and < 90 => "pass",
    >= 0 and < 50 => "fail",
};
```

```text
warning CS8509: The switch expression does not handle all possible values of its input type (it is not exhaustive). For example, the pattern '101' is not covered.
pass
Unhandled exception. System.Runtime.CompilerServices.SwitchExpressionException: Non-exhaustive switch expression failed to match its input.
Unmatched value was 120.
```

The warning even names a missing value. Treat CS8509 as an error: add the missing arms, or a final
`_ => throw new ArgumentOutOfRangeException(nameof(score))` that states the failure in your own words.

## Common mistakes

- **Ignoring CS8509.** The program compiles and fails later, on real data.
- **`not` without parentheses.** `is not A or B` means `(not A) or B`.
- **General arms first.** `string s` above `string { Length: 0 }` makes the specific arm
  unreachable (error CS8510).
- **Positional patterns on large types.** Swapping two parameters silently changes their meaning.

## Practice

1. Write `static string Size(int bytes)` returning `"small"` below 1024, `"medium"` below 1048576
   and `"large"` otherwise, as a switch expression.
2. Write a pattern that matches an `int[]` whose first element is 0 and whose length is at least 2.
3. Does `x is not null and not ""` match a `string x` that is `" "` (one space)?

### Answers

1. `bytes switch { < 1024 => "small", < 1048576 => "medium", _ => "large" }`. Arms are tried in
   order, so the second needs no lower bound.
2. `values is [0, _, ..]`: the first element is 0, `_` demands a second element, and `..` allows
   any more.
3. Yes. It is not null and not the empty string. To reject blank text, test
   `string.IsNullOrWhiteSpace(x)`.

## Key takeaways

- Patterns test type, value and shape, and can name what they match.
- A switch expression tries its arms in order and returns the first match; guards add conditions.
- `and`, `or` and `not` combine patterns; `not` binds most tightly, so use parentheses.
- Property, positional and list patterns take nested data apart; keep switch expressions
  exhaustive.

## Further reading

- [C# reference: Patterns](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/patterns)
- [C# reference: switch expression](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/switch-expression)
