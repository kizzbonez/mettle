---
title: Numbers and Operators
summary: Calculate with integers and decimals, avoid the traps of integer division, overflow and binary fractions, and convert between numbers and text with casts, Parse and TryParse.
minutes: 30
objectives:
  - Predict the result of integer division and remainder, including with negative numbers
  - Explain integer overflow and detect it with `checked`
  - Choose between `double` and `decimal` and explain why money uses `decimal`
  - Convert between numeric types and from text with casts, `Convert`, `Parse` and `TryParse`
---

## Outline

1. Arithmetic and precedence
2. Integer division and remainder
3. Changing a variable in place
4. Overflow and `checked`
5. `double` versus `decimal`
6. Converting between number types
7. From text to numbers
8. The `Math` class

## Arithmetic and precedence

C# has the usual operators: `+`, `-`, `*`, `/` and `%` (remainder). `*`, `/` and `%` are applied
before `+` and `-`, operators of the same level work from left to right, and parentheses change
the order.

```csharp
int crates = 17;
int perShelf = 5;
Console.WriteLine(crates + perShelf);
Console.WriteLine(crates * perShelf);
Console.WriteLine(crates / perShelf);
Console.WriteLine(crates % perShelf);
Console.WriteLine(2 + 3 * 4);
Console.WriteLine((2 + 3) * 4);
Console.WriteLine(-17 / 5);
Console.WriteLine(-17 % 5);
Console.WriteLine(17 / 5.0);
```

```text
22
85
3
2
14
20
-3
-2
3.4
```

## Integer division and remainder

When both sides of `/` are integers, the result is an integer: the fraction is thrown away,
which rounds **toward zero**. So `17 / 5` is 3 and `-17 / 5` is -3, not -4. The remainder `%` is
what is left over, and it takes the sign of the left-hand number: `-17 % 5` is -2.

Together they split a quantity: 17 crates fill 3 shelves of 5 with 2 left over. To get 3.4, at
least one side must be a fractional type, as in `17 / 5.0`. An integer divided by zero stops the
program with a `DivideByZeroException`.

## Changing a variable in place

`stock += 5` is short for `stock = stock + 5`, and there are `-=`, `*=`, `/=` and `%=` as well.
`count++` adds one and `count--` subtracts one:

```csharp
int stock = 10;
stock += 5;
stock -= 3;
stock *= 2;
Console.WriteLine(stock);
int count = 8;
int before = count++;
Console.WriteLine($"{before} {count}");
```

```text
24
8 9
```

`count++` gives the *old* value and then increments, so `before` is 8. `++count` increments
first and gives the new value. Using `++` inside a larger expression is easy to misread. Keep it
on a line of its own.

## Overflow and `checked`

An `int` holds values up to 2,147,483,647 (`int.MaxValue`). By default, a calculation that goes
past the limit does not stop: the value **wraps around** to the other end of the range. Inside
`checked( )`, the same calculation throws an `OverflowException` instead:

```csharp
int big = int.MaxValue;
int wrapped = big + 1;
Console.WriteLine(wrapped);
int safe = checked(big + 1);
Console.WriteLine(safe);
```

```text
-2147483648
Unhandled exception. System.OverflowException: Arithmetic operation resulted in an overflow.
   at Program.<Main>$(String[] args) in /home/ada/numbers/Program.cs:line 4
```

Wrapping is silent, which makes it dangerous. When values can be large, use `long`, whose limit
is about 9.2 × 10^18, or wrap the calculation in `checked`. When the overflow is visible to the
compiler, as in `int tooBig = 2147483647 + 1;`, it refuses to compile with error CS0220, "The
operation overflows at compile time in checked mode".

## `double` versus `decimal`

`double` stores numbers in binary, the way the processor calculates fastest. Most decimal
fractions, such as 0.1, have no exact binary form, so tiny errors appear. `decimal` stores
decimal digits exactly, which is why it is the type for money. A `decimal` literal ends in `m`.

```csharp
double a = 0.1 + 0.2;
decimal b = 0.1m + 0.2m;
Console.WriteLine(a);
Console.WriteLine(a == 0.3);
Console.WriteLine(b);
Console.WriteLine(b == 0.3m);
Console.WriteLine(1.0 / 0);
```

```text
0.30000000000000004
False
0.3
True
Infinity
```

Use `double` for measurements and science, where 15 significant digits are plenty and speed
matters, and `decimal` for amounts of money. Floating-point division by zero does not throw: it
gives `Infinity`, or `NaN` ("not a number") for `0.0 / 0`. A literal like `2.5` is a `double`,
and `float` (less precise, suffix `f`) is rarely needed. The two kinds do not mix without an
explicit conversion:

```csharp
decimal price = 19.99m;
double rate = 0.2;
decimal tax = price * rate;
```

```text
Program.cs(3,15): error CS0019: Operator '*' cannot be applied to operands of type 'decimal' and 'double'
```

Write the rate as `0.2m` instead.

## Converting between number types

A conversion that can never lose information happens on its own, for example `int` to `long`
or `int` to `double`. One that might lose information needs a **cast**: the target type in
parentheses.

```csharp
double weight = 7.9;
int whole = (int)weight;
long big = 3_000_000_000;
int truncated = (int)big;
int small = 250;
long widened = small;
Console.WriteLine($"{whole} {truncated} {widened}");
Console.WriteLine(Convert.ToInt32(7.9));
Console.WriteLine(Convert.ToInt32(2.5));
```

```text
7 -1294967296 250
8
2
```

Without the cast, `int whole = weight;` is error CS0266: "Cannot implicitly convert type
'double' to 'int'. An explicit conversion exists (are you missing a cast?)". A cast from `double`
to `int` cuts off the fraction, and a cast from a larger integer type keeps only the bits that
fit, which turned three billion into a negative number. `Convert.ToInt32` rounds to the nearest
whole number instead, and a value exactly halfway goes to the even neighbour, so 2.5 becomes 2.

## From text to numbers

Text typed by a user or read from a file is a `string`, even when it looks like a number.
`int.Parse` converts it, ignoring spaces around the digits, and throws when it cannot.
`int.TryParse` never throws: it returns `true` or `false`, and hands back the number through an
`out` argument, a variable the method fills in for you (lesson 8 explains `out`).

```csharp
int a = int.Parse(" 42 ");
Console.WriteLine(a + 1);
bool ok = int.TryParse("4x2", out int b);
Console.WriteLine($"{ok} {b}");
int c = int.Parse("forty-two");
```

```text
43
False 0
Unhandled exception. System.FormatException: The input string 'forty-two' was not in a correct format.
   at System.Number.ThrowFormatException[TChar](ReadOnlySpan`1 value)
   at System.Int32.Parse(String s)
   at Program.<Main>$(String[] args) in /home/ada/numbers/Program.cs:line 5
```

When parsing fails, `TryParse` sets the number to 0. A number too large for an `int`, such as
`"3000000000"`, makes `Parse` throw an `OverflowException`. Every number type has the same
pair: `double.Parse`, `decimal.TryParse` and so on. Use `TryParse` for anything a person typed.

## The `Math` class

`Math` holds ready-made calculations: `Math.Max(4, 9)` is 9, `Math.Min`, `Math.Abs(-12)` is 12,
`Math.Sqrt(81)` is 9, `Math.Pow(2, 10)` is 1024, `Math.Floor(-2.5)` is -3, `Math.Ceiling(2.1)` is
3, and `Math.PI` is π. `Math.Round(2.5)` returns 2, because by default a value exactly halfway is
rounded to the even neighbour. Write `Math.Round(2.5, MidpointRounding.AwayFromZero)` for 3, and
`Math.Round(19.987, 2)` for 19.99.

## Common mistakes

- **Expecting a fraction from two integers.** `7 / 2` is 3. Write `7 / 2.0` or cast first:
  `(double)total / count`.
- **Casting too late.** `(double)(7 / 2)` is 3, because the integer division already
  happened before the cast.
- **Comparing `double` values with `==`.** `0.1 + 0.2 == 0.3` is false. Use `decimal`, or check
  that the difference is tiny.
- **Using `double` for money.** Rounding errors add up across thousands of transactions.
- **Calling `Parse` on input.** One bad value stops the program. Use `TryParse`.
- **Forgetting the `m`.** `decimal price = 19.99;` is error CS0664, because `19.99` is a
  `double`.

## Practice

1. Print 135 minutes as hours and minutes, for example `2 h 15 min`.
2. Three test marks, 7, 8 and 8, are stored in `int` variables. Print their average as
   7.666666666666667, not 7.
3. What does each line print? `Console.WriteLine(7 / 2 * 2.0);` and
   `Console.WriteLine(7 / 2.0 * 2);`

### Answers

**1.** Division gives the hours, the remainder the minutes:

```csharp
int minutes = 135;
Console.WriteLine($"{minutes / 60} h {minutes % 60} min");
```

```text
2 h 15 min
```

**2.** Make one side of the division a `double`: `(a + b + c) / 3.0`, or
`(double)(a + b + c) / 3`. Both print 7.666666666666667. Writing `(a + b + c) / 3` prints 7.

**3.** `6` and `7`. In the first line `7 / 2` is integer division, 3, and 3 × 2.0 is 6. In the
second, `7 / 2.0` is 3.5 and 3.5 × 2 is 7.

## Key takeaways

- Integer `/` rounds toward zero, and `%` takes the sign of the left operand.
- Integer overflow wraps around silently. `checked` turns it into an `OverflowException`.
- `decimal` is exact for decimal fractions and is the type for money. `double` is fast and
  approximate.
- Widening conversions are automatic. Narrowing ones need a cast. `TryParse` converts text
  safely.

## Further reading

- [Microsoft Learn: Arithmetic operators](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/arithmetic-operators)
- [Microsoft Learn: Floating-point numeric types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/floating-point-numeric-types)
- [Microsoft Learn: Casting and type conversions](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/casting-and-type-conversions)
- [Microsoft Learn: How to convert a string to a number](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/how-to-convert-a-string-to-a-number)
