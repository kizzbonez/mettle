---
title: Methods
summary: Package code into methods with parameters and return values, overload them, use optional and named arguments, pass arguments by reference with ref, out and in, and write expression-bodied members.
minutes: 30
objectives:
  - Define and call static methods with parameters and return values, and fix "not all code paths return a value"
  - Overload a method and call methods with optional and named arguments
  - Explain pass by value and use `ref`, `out` and `in` correctly at both ends of a call
  - Write expression-bodied methods and local functions
---

## Outline

1. Why methods
2. Defining and calling a method
3. Every path must return
4. Overloading
5. Optional and named arguments
6. Passing by value, `ref`, `out` and `in`
7. Expression-bodied methods
8. Local functions

## Why methods

A **method** is a named block of code that does one job. You have been calling methods since
lesson 2: `Console.WriteLine`, `int.Parse`, `Math.Max`. Writing your own lets you give a
calculation a name, write it once and use it many times, and test it on its own. A good method
is short, does one thing, and has a name that says what: `BoxesNeeded`, not `Calc2`.

## Defining and calling a method

In C#, every method belongs to a type. Until lesson 11 explains classes properly, think of a
`static class` as a named container for methods:

```csharp
Console.WriteLine(Shipping.BoxesNeeded(23, 6));
Console.WriteLine(Shipping.BoxesNeeded(24, 6));
Shipping.PrintLabel("Lagos", 4);

static class Shipping
{
    public static int BoxesNeeded(int items, int perBox)
    {
        int boxes = items / perBox;
        if (items % perBox != 0)
        {
            boxes++;
        }
        return boxes;
    }

    public static void PrintLabel(string city, int boxes)
    {
        Console.WriteLine($"To {city}: {boxes} boxes");
    }
}
```

```text
4
4
To Lagos: 4 boxes
```

Read the first line of `BoxesNeeded`, its **signature**, from left to right:

- `public` lets code outside the class call it.
- `static` means you call it on the class itself: `Shipping.BoxesNeeded(...)`.
- `int` is the **return type**, the type of the value it gives back.
- `(int items, int perBox)` are the **parameters**, local variables that receive the
  **arguments** the caller passes, in order.

`return` ends the method and hands the value to the caller, where the call expression becomes
that value. `PrintLabel` has the return type `void`, meaning it returns nothing. It is called for
its effect. Types declared in a file with top-level statements must come after those statements.

Arguments must match the parameter types. `Shipping.BoxesNeeded("23", 6)` is error CS1503,
"Argument 1: cannot convert from 'string' to 'int'".

## Every path must return

A method with a return type must return a value on every path through it:

```csharp
Console.WriteLine(Shipping.BoxesNeeded(23, 6));

static class Shipping
{
    public static int BoxesNeeded(int items, int perBox)
    {
        if (perBox > 0)
        {
            return (items + perBox - 1) / perBox;
        }
    }
}
```

```text
Program.cs(5,23): error CS0161: 'Shipping.BoxesNeeded(int, int)': not all code paths return a value
```

When `perBox` is 0 or less, the method reaches its end with nothing to return. Decide what that
case means and handle it: return a value, or report the bad argument, as lesson 13 shows.

## Overloading

Several methods may share a name if their parameter lists differ in number or types. This is
**overloading**, and the compiler picks the version whose parameters fit the arguments.
`Console.WriteLine` has overloads for `string`, `int`, `bool` and many more.

## Optional and named arguments

A parameter with a default value is **optional**: callers may leave it out. Optional parameters
come after the required ones. A caller can also name an argument, which skips over others and
makes calls with several values readable:

```csharp
Console.WriteLine($"{Shipping.Cost(2.5m):F2}");
Console.WriteLine($"{Shipping.Cost(2.5m, 3):F2}");
Console.WriteLine($"{Shipping.Cost(2.5m, express: true):F2}");
Console.WriteLine($"{Shipping.Cost(weightKg: 1m, boxes: 2, express: true):F2}");
Console.WriteLine(Shipping.Cost(4));

static class Shipping
{
    public static decimal Cost(decimal weightKg, int boxes = 1, bool express = false)
    {
        decimal cost = weightKg * 1.20m + boxes * 2m;
        return express ? cost * 2 : cost;
    }

    public static string Cost(int days) => $"{days} days by road";
}
```

```text
5.00
9.00
10.00
10.40
4 days by road
```

`express: true` skips `boxes`, which keeps its default of 1. `Cost(4)` calls the other overload,
because `4` is an `int`. A default value must be a constant, such as a number or a string
literal.

## Passing by value, `ref`, `out` and `in`

By default an argument is **passed by value**: the parameter receives a copy, and changing the
parameter does not change the caller's variable. The modifier `ref` passes the variable itself,
and `out` lets a method hand back extra results:

```csharp
int stock = 10;
Inventory.TakeCopy(stock);
Console.WriteLine(stock);
Inventory.Take(ref stock);
Console.WriteLine(stock);
if (Inventory.TrySplit("12x4", out int rows, out int cols))
{
    Console.WriteLine($"{rows} rows of {cols}");
}
bool ok = Inventory.TrySplit("twelve", out int r2, out int c2);
Console.WriteLine($"{ok} {r2} {c2}");

static class Inventory
{
    public static void TakeCopy(int count)
    {
        count--;
    }

    public static void Take(ref int count)
    {
        count--;
    }

    public static bool TrySplit(string text, out int rows, out int cols)
    {
        rows = 0;
        cols = 0;
        string[] parts = text.Split('x');
        if (parts.Length != 2)
        {
            return false;
        }
        return int.TryParse(parts[0], out rows) && int.TryParse(parts[1], out cols);
    }
}
```

```text
10
9
12 rows of 4
False 0 0
```

- **`ref`**: the method can read and change the caller's variable, which must already have a
  value. Write `ref` at both ends: leaving it out of the call is error CS1620, "Argument 1 must
  be passed with the 'ref' keyword".
- **`out`**: the method *must* assign the parameter before it returns, or the compiler reports
  error CS0177. The caller may declare the variable right in the call, as in `out int rows`.
  This is the `TryParse` pattern from lesson 4: return `bool` for success and the result through
  `out`.
- **`in`**: the method receives a read-only reference. It exists to avoid copying large values
  and is rarely needed in everyday code.

Prefer return values. Use `out` for the "try" pattern, and `ref` only when a method genuinely
has to change the caller's variable.

## Expression-bodied methods

A method whose body is a single expression can be written with `=>` followed by that
expression, as `Cost(int days)` above. `public static int Double(int n) => n * 2;` means exactly
the same as a body of `{ return n * 2; }`. For a `void` method, the expression is simply run:
`static void Greet() => Console.WriteLine("Hi");`. Keep block bodies for anything longer.

## Local functions

In a file with top-level statements you can also declare a method directly among the
statements, without a class. It becomes a **local function** of the hidden `Main`:

```csharp
Console.WriteLine(Area(3, 4));
PrintTwice("hi");

int Area(int width, int height) => width * height;

void PrintTwice(string text)
{
    Console.WriteLine(text);
    Console.WriteLine(text);
}
```

```text
12
hi
hi
```

Local functions are handy in small programs, but they cannot be overloaded: a second `Area` is
error CS0128, "A local variable or function named 'Area' is already defined in this scope". Put
methods that belong together in a class.

## Common mistakes

- **Forgetting `return`** on some path: error CS0161.
- **Expecting a method to change an ordinary argument.** It changes a copy. Return the new value
  instead.
- **Leaving out `ref` or `out` in the call.** Both ends must say it.
- **Not assigning an `out` parameter** on every path: error CS0177.
- **Ignoring the return value.** `Shipping.BoxesNeeded(23, 6);` compiles and computes a result
  that is thrown away.
- **Methods that do too much.** If a name needs "and", split the method.

## Practice

1. Write `ToFahrenheit(double celsius)` as an expression-bodied method. What are 100 °C and
   -40 °C in Fahrenheit?
2. Write `Describe(double value, string unit = "C")` that returns the value with one decimal and
   the unit, such as `22.5 C`. Call it with and without a unit.
3. Write `Order(ref int a, ref int b)` that swaps the two variables when `a` is greater than
   `b`. What do `low` and `high` hold after calling it with 9 and 3?

### Answers

```csharp
Console.WriteLine(Temperature.ToFahrenheit(100));
Console.WriteLine(Temperature.ToFahrenheit(-40));
Console.WriteLine(Temperature.Describe(22.5));
Console.WriteLine(Temperature.Describe(22.5, "K"));
int low = 9, high = 3;
Temperature.Order(ref low, ref high);
Console.WriteLine($"{low} {high}");

static class Temperature
{
    public static double ToFahrenheit(double celsius) => celsius * 9 / 5 + 32;

    public static string Describe(double value, string unit = "C") => $"{value:F1} {unit}";

    public static void Order(ref int a, ref int b)
    {
        if (a > b)
        {
            int temp = a;
            a = b;
            b = temp;
        }
    }
}
```

```text
212
-40
22.5 C
22.5 K
3 9
```

The swap needs a third variable, because after `a = b` the old value of `a` would be lost.
Without `ref`, the method would swap its own copies and the caller would see no change.

## Key takeaways

- A method has a return type, a name and parameters. `return` hands a value back, and `void`
  methods return nothing.
- Overloads share a name and differ in parameters. Optional parameters have defaults, and named
  arguments can skip them.
- Arguments are copies unless passed with `ref` or `out`, which both ends of the call must write.
- `=>` writes a one-expression method. Top-level programs can declare local functions.

## Further reading

- [Microsoft Learn: Method parameters and modifiers](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/method-parameters)
- [Microsoft Learn: Named and optional arguments](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/named-and-optional-arguments)
- [Microsoft Learn: Jump statements, including return](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/jump-statements)
