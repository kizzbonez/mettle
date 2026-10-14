---
title: Variables and Types
summary: Store values in typed variables, let the compiler infer types with var, name things the C# way, keep fixed values in constants, and print values with string interpolation.
minutes: 25
objectives:
  - Declare, initialize and reassign variables of the common built-in types
  - Explain what `var` does and why the variable still has a fixed type
  - Use `const` for values that never change and follow the C# naming conventions
  - Print values with concatenation and string interpolation, and read type errors
---

## Outline

1. Declaring a variable
2. The built-in types
3. Types are fixed
4. Assign before you read
5. `var`: let the compiler write the type
6. Constants
7. Naming conventions
8. Printing values

## Declaring a variable

A **variable** is a named place that holds a value. In C# you declare one by writing its
**type**, its name and, usually, an initial value:

```csharp
string patient = "Ada Okafor";
int age = 37;
double temperature = 38.4;
bool admitted = true;
char ward = 'B';

Console.WriteLine("Patient: " + patient);
Console.WriteLine($"{patient} is {age}, temperature {temperature}, ward {ward}, admitted: {admitted}");

age = age + 1;
Console.WriteLine($"Next year: {age}");
```

```text
Patient: Ada Okafor
Ada Okafor is 37, temperature 38.4, ward B, admitted: True
Next year: 38
```

`int age = 37;` is a *declaration* with an *initializer*. `age = age + 1;` is an *assignment*:
it computes the right-hand side, 38, and stores it in the variable, replacing 37. The `=` sign
means "store", not "is equal to". A `bool` prints as `True` or `False` with a capital letter.

## The built-in types

| Type | Holds | Example |
| --- | --- | --- |
| `int` | whole numbers from about -2.1 to 2.1 billion | `37` |
| `long` | larger whole numbers, about ±9.2 × 10^18 | `3_000_000_000L` |
| `double` | numbers with a fractional part, about 15 digits | `38.4` |
| `decimal` | exact decimal numbers, 28 to 29 digits, for money | `19.99m` |
| `bool` | `true` or `false` | `true` |
| `char` | one character, in single quotes | `'B'` |
| `string` | text of any length, in double quotes | `"Ada"` |

There are more: `byte` (0 to 255), `short`, `float` and unsigned versions of the integer types.
Each keyword is a short name for a .NET type: `int` is `System.Int32`, `string` is
`System.String`, `bool` is `System.Boolean`. The underscore in `3_000_000_000` is a *digit
separator* that only helps people read. Lesson 4 compares the number types in detail.

## Types are fixed

Once a variable is declared, its type never changes. Storing a value of another type is a
compile-time error:

```csharp
int beds = 12;
beds = "twelve";
```

```text
Program.cs(2,8): error CS0029: Cannot implicitly convert type 'string' to 'int'
```

"Implicitly convert" means "convert without being told to". The compiler will never turn text
into a number on its own. Lesson 4 shows how to convert on purpose.

## Assign before you read

You may declare a variable without a value, but you must give it one before you read it:

```csharp
int visitors;
Console.WriteLine(visitors);
```

```text
Program.cs(2,19): error CS0165: Use of unassigned local variable 'visitors'
```

A *local variable* is one declared inside a method or among top-level statements. The compiler
follows every path through your code and refuses to let you read one that might hold no value
yet. This rule removes a whole class of bugs found in older languages, where such a variable
held whatever happened to be in memory.

## `var`: let the compiler write the type

When the initializer makes the type obvious, write `var` and the compiler fills in the type:

```csharp
var room = "B-12";
var floor = 3;
var rate = 89.5;
var paid = false;
Console.WriteLine($"{room.GetType()} {floor.GetType()} {rate.GetType()} {paid.GetType()}");
```

```text
System.String System.Int32 System.Double System.Boolean
```

`GetType()` asks a value for its type while the program runs. A whole-number literal such as `3`
is an `int`, and one with a decimal point such as `89.5` is a `double`. `var` is not a "any type"
variable: `floor` is an `int` forever, so `floor = "third";` fails with the same CS0029 error
as before. Because the type comes from the initializer, `var` needs one: `var empty;` is error
CS0818, "Implicitly-typed variables must be initialized". Use `var` when the type is clear from
the right-hand side, and write the type when it helps the reader.

## Constants

A value that must never change, such as a limit or a conversion factor, is declared with
`const`. A constant must be given its value in the declaration, and the compiler rejects any
later assignment:

```csharp
const int MaxVisitors = 2;
const double HoursPerShift = 7.5;
Console.WriteLine($"Each patient may have {MaxVisitors} visitors per {HoursPerShift}-hour shift.");
MaxVisitors = 3;
```

```text
Program.cs(4,1): error CS0131: The left-hand side of an assignment must be a variable, property or indexer
```

The message says that `MaxVisitors` is not a variable at all. A constant's value is written
into the compiled program wherever the name is used. Giving the number a name also documents
what it means.

## Naming conventions

The compiler's rules: a name starts with a letter or `_`, contains letters, digits and `_`, is
not a keyword such as `int` or `class`, and is case-sensitive, so `age` and `Age` are different.
On top of that, .NET code follows conventions:

- **camelCase** for local variables and parameters: `patient`, `roomNumber`.
- **PascalCase** for constants, methods, properties and types: `MaxVisitors`, `WriteLine`.
- Descriptive names over abbreviations: `temperature`, not `t` or `tmp`.

## Printing values

There are two ways to build text from values. **Concatenation** joins strings with `+`, and
turns any other value into text when one side is a string. **String interpolation** puts `$`
before the opening quote and any expression inside `{ }`:

```csharp
string name = "Kofi";
int pills = 3;
double dose = 2.5;
Console.WriteLine($"{name} takes {pills} pills of {dose} mg, {pills * dose} mg in all.");
int total = 1_000_000;
Console.WriteLine("Total: " + total + 5);
Console.WriteLine("Total: " + (total + 5));
```

```text
Kofi takes 3 pills of 2.5 mg, 7.5 mg in all.
Total: 10000005
Total: 1000005
```

`+` is evaluated from left to right. `"Total: " + total` is already a string, so `+ 5` appends
the character 5 instead of adding. Parentheses force the addition first. Interpolation avoids
the problem and is easier to read, which is why the rest of this course uses it.

The numbers in this course print with a dot before the decimals. If your computer is set to a
language that writes `38,4`, `Console.WriteLine` follows that setting. Lesson 5 shows how to
choose the format.

## Common mistakes

- **Using a variable before giving it a value.** Error CS0165. Initialize it when you declare it.
- **Single and double quotes.** `'B'` is a `char`, `"B"` is a `string`. `char c = "B";` does not
  compile.
- **Expecting `var` to accept any type later.** The type is fixed by the initializer.
- **Adding numbers inside concatenation.** `"Total: " + a + b` joins the digits. Use
  interpolation or parentheses.
- **Declaring a name twice.** `int age = 1;` followed by `int age = 2;` in the same block is
  error CS0128. To change the value, assign without the type.

## Practice

1. Declare variables for a book: title, number of pages, price in dollars and whether it is in
   stock. Choose a type for each and print one sentence with all four.
2. Which of these lines compile? `var x;` `const int Limit = 10;` `int n = 2.5;`
   `string s = "4" + 4;`
3. What does `Console.WriteLine("Sum: " + 2 + 3);` print, and how do you make it print `Sum: 5`?

### Answers

**1.** Text is a `string`, a page count an `int`, money a `decimal` (lesson 4 explains why) and
yes-or-no a `bool`:

```csharp
string title = "Dune";
int pages = 412;
decimal price = 9.99m;
bool inStock = true;
Console.WriteLine($"{title} has {pages} pages, costs ${price} and is in stock: {inStock}");
```

```text
Dune has 412 pages, costs $9.99 and is in stock: True
```

**2.** `const int Limit = 10;` and `string s = "4" + 4;` compile, the second giving `"44"`.
`var x;` has no initializer (CS0818), and `2.5` is a `double`, which does not fit in an `int`
without an explicit conversion.

**3.** It prints `Sum: 23`, because each `+` appends to the string built so far. Write
`"Sum: " + (2 + 3)` or `$"Sum: {2 + 3}"`.

## Key takeaways

- A variable has a type, a name and a value. The type is fixed when it is declared.
- The compiler rejects storing the wrong type and reading a variable that has no value yet.
- `var` asks the compiler to infer the type from the initializer. `const` declares a value that
  never changes.
- Use camelCase for locals, PascalCase for constants, and string interpolation for output.

## Further reading

- [Microsoft Learn: Declaration statements](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/declarations)
- [Microsoft Learn: Built-in types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/built-in-types)
- [Microsoft Learn: Identifier names, rules and conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/identifier-names)
- [Microsoft Learn: String interpolation](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/tokens/interpolated)
