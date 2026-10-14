---
title: Properties and Encapsulation
summary: Protect an object's data behind access modifiers and properties, validate values with the C# 14 `field` keyword, add indexers, and assign through possibly null references with `?.`.
minutes: 25
objectives:
  - Choose the narrowest access modifier for a type or member from the six C# offers
  - Write auto-properties with restricted setters, computed properties and validating setters that use `field`
  - Declare an indexer so that an object can be used with square brackets
  - Use null-conditional assignment and say when its right-hand side is evaluated
---

## Outline

1. Encapsulation
2. Access modifiers
3. Restricted setters and computed properties
4. Validation with `field`
5. Indexers
6. Null-conditional assignment

## Encapsulation

**Encapsulation** means that an object keeps its data to itself and lets the outside world change it
only through members that enforce the rules. A bank account whose balance anyone can set to any
number has no rules at all. One whose balance changes only through `Deposit` and `Withdraw` can
refuse an overdraft, log every movement, and change how it stores money later without breaking a
single caller. The tools are access modifiers, which decide who can see a member, and properties,
which put code between the caller and the data.

## Access modifiers

An **assembly** is the `.dll` or `.exe` that one project compiles to. The six access levels are:

- `public`: any code, in any assembly.
- `private`: only code inside the same class or struct. This is the default for members.
- `protected`: the same class and classes derived from it (lesson 3).
- `internal`: any code in the same assembly. This is the default for top-level types.
- `protected internal`: the same assembly, *or* derived classes in other assemblies.
- `private protected`: derived classes, but only those in the same assembly.

Start with `private` and widen only when a caller needs access. Everything you make public is a
promise that other code may come to depend on.

## Restricted setters and computed properties

The two accessors of a property can have different access. `public decimal Balance { get; private set; }`
can be read everywhere and written only inside the class. A **computed property** has only a
getter that calculates its value from other data, so there is nothing to keep in sync.

```csharp
var account = new Account("Ada");
account.Deposit(50m);
account.Withdraw(20m);
Console.WriteLine($"{account.Owner}: {account.Balance} after {account.Transactions} transactions");

try
{
    account.Withdraw(100m);
}
catch (InvalidOperationException e)
{
    Console.WriteLine(e.Message);
}

class Account
{
    private readonly List<decimal> history = new();

    public Account(string owner) => Owner = owner;

    public string Owner { get; }
    public decimal Balance { get; private set; }
    public int Transactions => history.Count;   // computed, read-only

    public void Deposit(decimal amount)
    {
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount));
        Balance += amount;
        history.Add(amount);
    }

    public void Withdraw(decimal amount)
    {
        if (amount > Balance)
            throw new InvalidOperationException($"Cannot withdraw {amount}: balance is {Balance}.");
        Balance -= amount;
        history.Add(-amount);
    }
}
```

```text
Ada: 30 after 2 transactions
Cannot withdraw 100: balance is 30.
```

`history` is `private`, so no caller can add a fake entry, and `account.Balance = 1000m;` is
error CS0272 ("the set accessor is inaccessible"). `Owner` has no setter at all, so it can be
assigned only in the constructor.

## Validation with `field`

An **auto-property** such as `{ get; set; }` stores its value in a hidden **backing field** that the
compiler creates. Until C# 13, adding a single check to the setter meant giving up the
auto-property: you declared a private field yourself and wrote both accessors by hand. C# 14 adds
the **`field`** keyword, which names the compiler's backing field inside an accessor. You write
only the accessor that needs logic and keep `get;` short.

```csharp
var sensor = new Sensor { Name = "  boiler ", Celsius = 71.5 };
Console.WriteLine($"[{sensor.Name}] {sensor.Celsius}");

try
{
    sensor.Celsius = -300;
}
catch (ArgumentOutOfRangeException e)
{
    Console.WriteLine(e.Message);
}

class Sensor
{
    public string Name
    {
        get;
        set => field = value.Trim();
    } = "";

    public double Celsius
    {
        get;
        set => field = value >= -273.15
            ? value
            : throw new ArgumentOutOfRangeException(nameof(value), "Below absolute zero.");
    }
}
```

```text
[boiler] 71.5
Below absolute zero. (Parameter 'value')
```

`value` is the incoming value in a setter. The initializer `= ""` stores straight into the backing
field without running the setter. Because `field` is now a keyword inside accessors, a class that
already has a member named `field` must write `this.field` or `@field` to mean its own member.

## Indexers

An **indexer** lets callers use square brackets on your object, as they do on an array or a
`List<T>`. It is declared like a property named `this` with a parameter list, and it can be
overloaded on the parameter type.

```csharp
var shelf = new Shelf(3);
shelf[0] = "Dune";
shelf[2] = "Emma";
Console.WriteLine(shelf[0]);
Console.WriteLine(shelf["Emma"]);
Console.WriteLine(shelf[1] ?? "(empty)");

class Shelf
{
    private readonly string?[] slots;
    public Shelf(int size) => slots = new string?[size];

    public string? this[int slot]          // read and write by position
    {
        get => slots[slot];
        set => slots[slot] = value;
    }

    public int this[string title] => Array.IndexOf(slots, title);   // read-only, by title
}
```

```text
Dune
2
(empty)
```

The array stays private; the indexer decides what callers may do with it. A dictionary uses
exactly this feature for `dict[key]`.

## Null-conditional assignment

The Basic level used `?.` to *read* through a reference that might be `null`: `customer?.Email`
gives `null` instead of throwing. C# 14 lets `?.` appear on the *left* of an assignment, including
compound assignments such as `+=`. If the object is `null`, nothing happens, and the right-hand side
is not even evaluated.

```csharp
Customer? found = Find("ada");
Customer? missing = Find("zed");

found?.Email = Normalise("  ADA@Example.com ");
missing?.Email = Normalise("never@example.com");   // right side is not evaluated
found?.Visits += 1;

Console.WriteLine($"{found?.Email} {found?.Visits}");
Console.WriteLine(missing?.Email ?? "no customer");

static Customer? Find(string name) => name == "ada" ? new Customer() : null;

static string Normalise(string email)
{
    Console.WriteLine($"normalising {email.Trim()}");
    return email.Trim().ToLowerInvariant();
}

class Customer
{
    public string Email { get; set; } = "";
    public int Visits { get; set; }
}
```

```text
normalising ADA@Example.com
ada@example.com 1
no customer
```

`Normalise` ran once, for the customer that exists. The operators `++` and `--` are not allowed:
`c?.Visits++` is error CS1059. Use `c?.Visits += 1`.

## Common mistakes

- **Public fields.** A field cannot validate, and turning it into a property later changes how
  other compiled code binds to it. Expose properties.
- **A public setter by habit.** Ask whether outside code should change the value at all.
- **Exposing the private list.** Returning the `List<T>` you store lets callers bypass every rule.
  Return a count, a copy or a read-only view (lesson 8).
- **Hiding expensive work in a getter.** Callers expect a property read to be cheap. Use a method
  for slow work.

## Practice

1. Give `Sensor` a `MaxCelsius` property and a computed `IsOverheating` that compares the two.
2. Rewrite `public int Stock { get; set; }` so that negative values are stored as 0, using `field`.
3. `Order? order = null; order?.Total = Price();` How many times is `Price` called?

### Answers

1. `public double MaxCelsius { get; set; } = 100;` and
   `public bool IsOverheating => Celsius > MaxCelsius;`. The computed property is always current.
2. `public int Stock { get; set => field = Math.Max(0, value); }`.
3. Zero. When the receiver is `null`, the assignment, including its right-hand side, is skipped.

## Key takeaways

- Encapsulation keeps data private and exposes members that enforce the rules; use the narrowest
  access that works.
- Properties can mix accessor access levels, compute their value, or validate it with `field`
  without a hand-written backing field.
- Indexers give an object square-bracket access on any parameter type.
- `a?.B = c` and `a?.B += c` do nothing, and skip `c`, when `a` is `null`.

## Further reading

- [Properties (C# programming guide)](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties)
- [C# reference: the field keyword](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/field)
- [Access modifiers (C# programming guide)](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/access-modifiers)
- [What's new in C# 14](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14)
