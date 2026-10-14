---
title: Delegates and Lambdas
summary: Treat behaviour as a value, store methods in delegates, write lambdas for `Func`, `Action` and `Predicate`, and predict what a lambda sees when it captures a variable.
minutes: 30
objectives:
  - Declare a delegate type, assign methods to it and invoke it
  - Choose between `Func`, `Action` and `Predicate` and write expression and statement lambdas for them
  - Pass behaviour into a method as a delegate parameter
  - Predict the output of code whose lambdas capture outer variables, including inside `for` and `foreach` loops
---

## Outline

1. A delegate is a type for methods
2. `Func`, `Action` and `Predicate`
3. Lambda expressions
4. Closures: lambdas that capture variables
5. `static` lambdas and combined delegates

## A delegate is a type for methods

So far, variables have held data. A **delegate** is a type whose values are *methods*: a delegate
variable refers to a method with a particular parameter list and return type, and calling the
variable calls the method. This lets you hand behaviour to other code. A checkout can accept
"some pricing rule" without knowing which one; a sort can accept "some way of comparing".

```csharp
PriceRule rule = HalfPrice;   // a method converts to a matching delegate
Console.WriteLine(rule(80m));
rule = TenOff;
Console.WriteLine(rule(80m));
Console.WriteLine(Checkout(80m, HalfPrice, TenOff));

static decimal HalfPrice(decimal price) => price / 2;
static decimal TenOff(decimal price) => Math.Max(0, price - 10);

static decimal Checkout(decimal price, params PriceRule[] rules)
{
    foreach (PriceRule apply in rules)
    {
        price = apply(price);
    }
    return price;
}

delegate decimal PriceRule(decimal price);
```

```text
40
70
30
```

The last line declares the delegate type: anything that takes a `decimal` and returns a `decimal`
is a `PriceRule`. Writing a method's name without parentheses, `HalfPrice`, refers to the method
instead of calling it. The compiler checks that its signature matches, so a delegate is type-safe.
`Checkout` has no idea what the rules do; new rules need no change to it.

## `Func`, `Action` and `Predicate`

Declaring a delegate type for every shape of method would be tedious, so .NET provides generic ones:

- **`Func<T1, ..., TResult>`** takes up to 16 arguments and returns a value. The *last* type
  argument is the return type: `Func<string, int>` takes a `string` and returns an `int`.
- **`Action<T1, ...>`** takes arguments and returns nothing (`void`).
- **`Predicate<T>`** takes one `T` and returns `bool`, a yes-or-no test. `Func<T, bool>` means the
  same; older APIs such as `List<T>.FindAll` use `Predicate<T>`, and LINQ uses `Func<T, bool>`.

Declare your own delegate type only when a descriptive name like `PriceRule` helps readers.

## Lambda expressions

A **lambda expression** is a method without a name, written where it is needed:
`parameters => body`. An **expression lambda** has a single expression as its body and returns its
value. A **statement lambda** has a block in braces and uses `return` like a method. Parameter types
are usually inferred from the delegate type the lambda is assigned to.

```csharp
Func<int, int, int> add = (a, b) => a + b;
Func<string, bool> isLong = s => s.Length > 5;
Action<string> shout = message => Console.WriteLine(message.ToUpper());
Predicate<int> isEven = n => n % 2 == 0;

Console.WriteLine($"{add(2, 3)} {isLong("delegate")}");
shout("lambdas are values");

var numbers = new List<int> { 1, 2, 3, 4, 5, 6 };
Console.WriteLine(string.Join(",", numbers.FindAll(isEven)));
numbers.RemoveAll(n => n > 4);
numbers.ForEach(n => Console.Write($"[{n}]"));
Console.WriteLine();

var parse = (string text) => int.Parse(text);   // inferred as Func<string, int>
Func<int, string> describe = n =>
{
    string parity = n % 2 == 0 ? "even" : "odd";
    return $"{n} is {parity}";
};
Console.WriteLine($"{parse("41") + 1}, {describe(7)}");
```

```text
5 True
LAMBDAS ARE VALUES
2,4,6
[1][2][3][4]
42, 7 is odd
```

One parameter needs no parentheses; zero or several do: `() => 42`, `(a, b) => a + b`. With `var`,
the lambda must say its parameter types, as `parse` does, so that the compiler can pick a
delegate type. `var s = x => x * 2;` is error CS8917, "The delegate type could not be inferred."
`RemoveAll(n => n > 4)` shows the most common use: passing a small piece of behaviour to a method
in one line.

## Closures: lambdas that capture variables

A lambda can use local variables and parameters of the method around it. It then **captures**
them, and the combination of lambda and captured variables is called a **closure**. Two rules
explain every closure puzzle:

1. A lambda captures the *variable*, not its value at that moment. It sees later changes, and its
   own changes are visible outside.
2. A captured variable lives as long as the delegate that uses it, even after its method returns.

```csharp
Func<int> frontDesk = MakeCounter(100);
Func<int> backDesk = MakeCounter(500);
Console.WriteLine($"{frontDesk()} {frontDesk()} {backDesk()} {frontDesk()}");

int threshold = 10;
Predicate<int> isBig = n => n > threshold;
threshold = 100;               // the lambda sees the variable, not a snapshot
Console.WriteLine(isBig(50));

var actions = new List<Action>();
for (int i = 0; i < 3; i++)
{
    actions.Add(() => Console.Write($"for:{i} "));
}
foreach (int n in new[] { 0, 1, 2 })
{
    actions.Add(() => Console.Write($"foreach:{n} "));
}
foreach (Action act in actions) act();
Console.WriteLine();

static Func<int> MakeCounter(int start)
{
    int current = start;       // captured: it lives as long as the delegate does
    return () => current++;
}
```

```text
100 101 500 102
False
for:3 for:3 for:3 foreach:0 foreach:1 foreach:2 
```

- Each call to `MakeCounter` creates a new `current`, so the two desks count independently, and
  each keeps its count between calls although `MakeCounter` has long returned.
- `isBig(50)` is `False` because `threshold` was 100 by the time the lambda ran.
- A `for` loop has **one** variable `i` for the whole loop. All three lambdas share it, and after
  the loop it is 3. A `foreach` loop creates a **fresh** variable on each pass, so each lambda keeps
  its own value. To fix the `for` version, copy `i` into a local inside the body and capture that.

## `static` lambdas and combined delegates

Capturing is convenient but easy to do by accident, and a captured variable keeps its objects
alive. Marking a lambda `static` forbids capturing locals and instance members:

```csharp
int limit = 5;
Func<int, bool> check = static n => n > limit;
```

```text
error CS8820: A static anonymous function cannot contain a reference to 'limit'.
```

Delegates can also be combined with `+=`. Invoking a combined delegate calls every method in order
(for a delegate that returns a value, you get the last one's result). This is the machinery behind
events, which the Advanced level covers.

## Common mistakes

- **Calling instead of referring.** `rule = HalfPrice();` calls the method; `rule = HalfPrice;`
  stores it.
- **Capturing a `for` variable.** Every lambda sees the final value. Copy it into a local first.
- **Assuming a snapshot.** A captured variable that changes later changes what the lambda sees.
- **Long statement lambdas.** Past a few lines, a named method is easier to read and to test.

## Practice

1. Declare a `Func<double, double, double>` that returns the larger of two numbers.
2. Write `static List<T> Keep<T>(List<T> items, Func<T, bool> test)` and call it with a lambda that
   keeps strings starting with `"a"`.
3. What does this print? `int x = 1; Action show = () => Console.Write(x); x = 2; show(); x = 3;`

### Answers

1. `Func<double, double, double> max = (a, b) => a > b ? a : b;` (or `Math.Max`, a method group).
2. Loop over `items`, add each item for which `test(item)` is true to a new list and return it. The
   call is `Keep(words, w => w.StartsWith("a"))`.
3. `2`. The lambda reads `x` when it runs, after `x = 2`; the later `x = 3` comes too late.

## Key takeaways

- A delegate holds a reference to a method with a fixed signature; calling the delegate calls the
  method.
- `Func` returns a value, `Action` returns nothing, and `Predicate<T>` answers yes or no.
- Lambdas are inline methods; they capture variables, not values, and keep them alive.
- A `for` loop shares one variable across iterations, a `foreach` loop does not.

## Further reading

- [Work with delegate types in C#](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/delegates/)
- [C# reference: Lambda expressions](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions)
