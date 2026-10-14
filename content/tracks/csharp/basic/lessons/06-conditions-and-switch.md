---
title: Conditions and switch
summary: Make decisions with comparison and logical operators, if and else, the conditional operator, the switch statement and a first switch expression, and understand block scope.
minutes: 25
objectives:
  - Write conditions with comparison and logical operators and predict short-circuit evaluation
  - Choose between `if`/`else if`/`else`, the conditional operator `?:` and `switch`
  - Explain block scope and why a variable declared inside braces is not visible after them
  - Write a `switch` statement and a `switch` expression and read the compiler's diagnostics about them
---

## Outline

1. Comparisons produce `bool`
2. `if`, `else if` and `else`
3. Combining conditions
4. Blocks and scope
5. The conditional operator
6. The `switch` statement
7. A first `switch` expression

## Comparisons produce `bool`

A **condition** is an expression of type `bool`. The comparison operators produce one:

| Operator | Meaning |
| --- | --- |
| `==` | equal to |
| `!=` | not equal to |
| `<`, `>` | less than, greater than |
| `<=`, `>=` | less than or equal, greater than or equal |

Remember from lesson 3 that a single `=` stores a value. Using it in a condition is a
compile-time error, not a silent bug:

```csharp
int score = 7;
if (score = 10)
{
    Console.WriteLine("Perfect");
}
```

```text
Program.cs(2,5): error CS0029: Cannot implicitly convert type 'int' to 'bool'
Program.cs(1,5): warning CS0219: The variable 'score' is assigned but its value is never used
```

`score = 10` is an assignment whose value is the `int` 10, and an `if` only accepts a `bool`.
Write `score == 10`. The warning is a side effect: since the program never reads `score`, the
compiler points out that the variable is useless. Fix errors first, then warnings.

## `if`, `else if` and `else`

```csharp
int temperature = 31;
if (temperature > 30)
{
    Console.WriteLine("Heat warning");
}
else if (temperature < 0)
{
    Console.WriteLine("Frost warning");
}
else
{
    Console.WriteLine("No warning");
}
```

```text
Heat warning
```

The conditions are tested from top to bottom, and only the block of the first one that is
`true` runs. `else` catches everything left over and is optional. The braces mark a **block**, a
group of statements that belongs together. C# allows you to leave them out when a block has one
statement, but then only that statement belongs to the `if`, whatever the indentation says:

```csharp
int temperature = 10;
if (temperature > 30)
    Console.WriteLine("Heat warning");
    Console.WriteLine("Drink water");
```

```text
Drink water
```

The second line looks like part of the `if`, but it runs every time. Always write the braces.

## Combining conditions

`&&` means "and", `||` means "or" and `!` means "not":

```csharp
bool raining = true;
bool windy = false;
int temperature = 22;
Console.WriteLine(raining && windy);
Console.WriteLine(raining || windy);
Console.WriteLine(!raining);
Console.WriteLine(temperature >= 20 && temperature <= 25);
```

```text
False
True
False
True
```

The last line is how you test a range: C# has no `20 <= t <= 25`. `&&` and `||` **short-circuit**:
they evaluate the right side only when it can change the answer. In `station != null &&
station.Length > 3`, the length is only read when `station` is not `null`, a missing value that
lesson 12 covers, so the check cannot crash. `!` is applied first, then `&&`, then `||`: use
parentheses whenever you mix `&&` and `||`, as in `(a && b) || c`.

## Blocks and scope

A variable declared inside a block exists only until the closing brace. That region is its
**scope**:

```csharp
int reading = 12;
if (reading > 10)
{
    string note = "high";
    Console.WriteLine(note);
}
Console.WriteLine(note);
```

```text
Program.cs(7,19): error CS0103: The name 'note' does not exist in the current context
```

To use the value after the `if`, declare the variable before it, give it a starting value, and
assign it inside. Scope keeps names local, so two separate blocks can each have their own `note`.

## The conditional operator

When both branches only produce a value, the **conditional operator** `condition ? a : b` is
shorter than an `if`. It gives `a` when the condition is `true` and `b` otherwise:

```csharp
int windSpeed = 55;
string level = windSpeed > 50 ? "storm" : "breeze";
Console.WriteLine(level);
int copies = 1;
Console.WriteLine($"{copies} {(copies == 1 ? "copy" : "copies")}");
```

```text
storm
1 copy
```

Inside an interpolated string, wrap it in parentheses, because a colon there would start a
format specifier.

## The `switch` statement

When one value is compared with many possibilities, `switch` is clearer than a chain of `if`s:

```csharp
string day = "Sat";
switch (day)
{
    case "Sat":
    case "Sun":
        Console.WriteLine("Weekend: station closed");
        break;
    case "Mon":
        Console.WriteLine("Maintenance day");
        break;
    default:
        Console.WriteLine("Open 8 to 18");
        break;
}
int uv = 9;
switch (uv)
{
    case < 3:
        Console.WriteLine("Low");
        break;
    case < 8:
        Console.WriteLine("Moderate to high");
        break;
    default:
        Console.WriteLine("Very high");
        break;
}
```

```text
Weekend: station closed
Very high
```

- Each `case` label is a pattern to match: a constant such as `"Sat"`, or a comparison such as
  `< 3`. Cases are tried from top to bottom.
- Several labels can share one section, as `"Sat"` and `"Sun"` do.
- `default` runs when nothing else matched.
- Every section must end with `break` (or `return`). Unlike C, C# never lets one section *fall
  through* into the next. Forgetting the `break` is a compile-time error:
  `error CS0163: Control cannot fall through from one case label ('case "Mon":') to another`.

## A first `switch` expression

A **switch expression** chooses a *value* instead of running statements. The value goes first,
then `switch`, then *arms* of the form `pattern => result`, separated by commas:

```csharp
int windSpeed = 64;
string beaufort = windSpeed switch
{
    < 1 => "calm",
    < 20 => "breeze",
    < 62 => "strong wind",
    < 118 => "gale or storm",
    _ => "hurricane",
};
Console.WriteLine(beaufort);
```

```text
gale or storm
```

The first matching arm wins, and `_` (the *discard*) matches anything. The compiler checks that
the arms cover every possible value. Leave out the `_` arm and it warns:

```csharp
string code = "E";
string direction = code switch
{
    "N" => "north",
    "S" => "south",
};
Console.WriteLine(direction);
```

```text
Program.cs(2,25): warning CS8509: The switch expression does not handle all possible values of its input type (it is not exhaustive). For example, the pattern '""' is not covered.
Unhandled exception. System.Runtime.CompilerServices.SwitchExpressionException: Non-exhaustive switch expression failed to match its input.
Unmatched value was E.
   at <PrivateImplementationDetails>.ThrowSwitchExpressionException(Object unmatchedValue)
   at Program.<Main>$(String[] args) in /home/ada/weather/Program.cs:line 2
```

A warning still lets the program build, so it ran, and `"E"` matched no arm. Treat this warning
as an error and add the missing arm. Later levels of this track cover patterns in depth.

## Common mistakes

- **`=` instead of `==`** in a condition: error CS0029.
- **Leaving out braces.** Only the first statement belongs to the `if`.
- **Writing a range as `20 <= t <= 25`.** Write `t >= 20 && t <= 25`.
- **Testing in the wrong order.** In `if (mark >= 60) ... else if (mark >= 90)`, the second
  branch can never run. Put the most specific test first.
- **A missing `break`** in a `switch` section: error CS0163.
- **Ignoring warning CS8509.** A non-exhaustive switch expression throws at run time.

## Practice

1. A year is a leap year if it is divisible by 4 and not by 100, or if it is divisible by 400.
   Write the condition and check 1900, 2000, 2023 and 2024.
2. Use a switch expression to turn a mark from 0 to 100 into a grade: 90 or more is `A`, 75 or
   more `B`, 60 or more `C`, anything else `F`. What is the grade for 74?
3. Why does this not compile, and how do you fix it?
   `if (ok) { int count = 1; } Console.WriteLine(count);`

### Answers

**1.** The parentheses group the first rule, so `||` combines two complete tests:

```csharp
int year = 1900;
bool leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
Console.WriteLine($"{year}: {leap}");
```

```text
1900: False
```

1900 is divisible by 100 but not by 400. Changing `year` gives `True` for 2000 and 2024 and
`False` for 2023. The next lesson shows how a loop checks all four in one run.

**2.** The arms are tested in order, so each one only needs a lower bound:

```csharp
int mark = 74;
string grade = mark switch
{
    >= 90 => "A",
    >= 75 => "B",
    >= 60 => "C",
    _ => "F",
};
Console.WriteLine(grade);
```

```text
C
```

**3.** `count` is declared inside the braces, so its scope ends there (error CS0103). Declare
`int count = 0;` before the `if` and write `count = 1;` inside it.

## Key takeaways

- Conditions are `bool` expressions built from comparisons, `&&`, `||` and `!`. `&&` and `||`
  short-circuit.
- Only the first `true` branch of an `if`/`else if` chain runs. Always use braces.
- A variable lives until the end of the block that declares it.
- `switch` sections never fall through. A `switch` expression picks a value, and `_` makes it
  exhaustive.

## Further reading

- [Microsoft Learn: The if and switch statements](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/selection-statements)
- [Microsoft Learn: The switch expression](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/switch-expression)
- [Microsoft Learn: Boolean logical operators](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/boolean-logical-operators)
