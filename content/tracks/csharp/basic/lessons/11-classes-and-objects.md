---
title: Classes and Objects
summary: Define your own types with classes, give them fields, properties, constructors and methods, create objects with new and object initializers, and tell instance members from static ones.
minutes: 30
objectives:
  - Define a class with private fields, public properties, a constructor and methods, and create objects from it
  - Explain `public` and `private`, read-only and computed properties, and what `this` refers to
  - Create objects with object initializers and predict what happens when two variables refer to one object
  - Distinguish instance members from `static` members
---

## Outline

1. Classes and objects
2. A first class
3. Fields, properties and access
4. Constructors and `this`
5. Object initializers
6. Two variables, one object
7. Static members

## Classes and objects

A **class** defines your own type, bundling **data** (what an object knows) with **behavior**
(what it can do). The class is a blueprint. An **object**, or **instance**, is one thing built
from it with `new`, with its own copy of the data.

## A first class

```csharp
var card = new LibraryCard("C-1001", "Ines");
card.Borrow(3);
card.Borrow(2);
Console.WriteLine($"{card.Number} {card.Holder} has {card.BooksOut} books out");
card.ReturnBook();
Console.WriteLine(card.BooksOut);

class LibraryCard
{
    private int _booksOut;

    public LibraryCard(string number, string holder)
    {
        Number = number;
        Holder = holder;
    }

    public string Number { get; }
    public string Holder { get; set; }
    public int BooksOut => _booksOut;

    public void Borrow(int count)
    {
        _booksOut += count;
    }

    public void ReturnBook()
    {
        if (_booksOut > 0)
        {
            _booksOut--;
        }
    }
}
```

```text
C-1001 Ines has 5 books out
4
```

The class has five kinds of **members**:

- `_booksOut` is a **field**, a variable that belongs to each object.
- `LibraryCard(...)` is a **constructor**, the method that runs when `new` creates an object.
- `Number`, `Holder` and `BooksOut` are **properties**, which look like fields from outside.
- `Borrow` and `ReturnBook` are **methods**. Unlike the static methods of lesson 8, they work on
  one particular object: `card.Borrow(3)` changes `card`'s count.

## Fields, properties and access

`private` means "only code inside this class may use it", and `public` means "any code may".
Members are `private` when you write neither. The usual design keeps fields private and exposes
properties, so the class decides what outsiders may do:

- `{ get; set; }` is an **auto-implemented property**: the compiler creates a hidden field.
  Anyone may read and change `Holder`.
- `{ get; }` alone is **read-only**: only the constructor can set `Number`.
- `{ get; private set; }` would let anyone read and only the class change.
- `BooksOut => _booksOut` is a **computed** property with only a `get`, written with `=>` as in
  lesson 8. Outsiders can read the count but must use `Borrow` and `ReturnBook` to change it,
  which is how `ReturnBook` can guarantee the count never goes below zero.

The compiler enforces all of this:

```csharp
var card = new LibraryCard("C-1001", "Ines");
card.Number = "C-9999";
card._booksOut = 50;

class LibraryCard
{
    private int _booksOut;

    public LibraryCard(string number, string holder)
    {
        Number = number;
        Holder = holder;
    }

    public string Number { get; }
    public string Holder { get; set; }
}
```

```text
Program.cs(2,1): error CS0200: Property or indexer 'LibraryCard.Number' cannot be assigned to -- it is read only
Program.cs(3,6): error CS0122: 'LibraryCard._booksOut' is inaccessible due to its protection level
Program.cs(7,17): warning CS0169: The field 'LibraryCard._booksOut' is never used
```

Hiding data behind members like this is called **encapsulation**: the class protects its own
rules. (The warning is true of this cut-down class, which never uses its field.)

A property can also check the value it is given. C# 14 added the `field` keyword, which means
"the hidden field of this property", so a check needs no field of your own:

```csharp
var t = new Thermostat();
t.Target = 21.5;
Console.WriteLine(t.Target);
t.Target = 40;

class Thermostat
{
    public double Target
    {
        get;
        set
        {
            if (value < 5 || value > 30)
            {
                throw new ArgumentOutOfRangeException(nameof(value), "Target must be between 5 and 30.");
            }
            field = value;
        }
    } = 18;
}
```

```text
21.5
Unhandled exception. System.ArgumentOutOfRangeException: Target must be between 5 and 30. (Parameter 'value')
   at Thermostat.set_Target(Double value) in /home/ada/rooms/Program.cs:line 15
   at Program.<Main>$(String[] args) in /home/ada/rooms/Program.cs:line 4
```

Inside `set`, `value` is the value being assigned. `= 18` gives the property a starting value.
`throw` stops the assignment by reporting an error, which lesson 13 explains.

## Constructors and `this`

A constructor has the class's name and no return type. Its job is to put a new object into a
valid state, so that no code ever sees a half-made card. Inside any member, `this` means "the
object this code is running for". You need it when a parameter has the same name as a field:

```csharp
var counter = new Counter(5);
Console.WriteLine(counter.Value);

class Counter
{
    private int value;

    public Counter(int value)
    {
        this.value = value;
    }

    public int Value => value;
}
```

```text
5
```

Writing `value = value;` instead would assign the parameter to itself. The compiler warns,
"CS1717: Assignment made to same variable; did you mean to assign something else?", and the
field stays 0. The `_` prefix on private fields avoids the clash altogether.

## Object initializers

When a class has settable properties, an **object initializer** sets them right after the
constructor runs, without a constructor for every combination:

```csharp
var first = new Room { Name = "Study 1", Seats = 4 };
var second = first;
second.Seats = 6;
Console.WriteLine($"{first.Name}: {first.Seats} seats");
var other = new Room { Name = "Study 1", Seats = 6 };
Console.WriteLine(first == second);
Console.WriteLine(first == other);
Room quiet = new() { Name = "Quiet", Seats = 1 };
Console.WriteLine(quiet.Name);
Console.WriteLine(new Room().Name);

class Room
{
    public string Name { get; set; } = "Unnamed";
    public int Seats { get; set; }
}
```

```text
Study 1: 6 seats
True
False
Quiet
Unnamed
```

A class without a constructor gets an empty one with no parameters, so `new Room()` works.
`= "Unnamed"` is the starting value for objects that do not set `Name`.

## Two variables, one object

A class is a **reference type**, like the lists of lesson 9. `var second = first;` copies the
reference, so changing `second.Seats` changed the one room both names refer to. For classes,
`==` asks "the same object?": `first == other` is `false` although every property is equal.
`Console.WriteLine(card)` prints only the type name, `LibraryCard`. Later levels show how to
change both behaviors.

## Static members

A member marked `static` belongs to the class itself, not to any object. It is shared by all
objects and is used through the class name:

```csharp
var a = new Ticket("Dune");
var b = new Ticket("Heat");
var c = new Ticket("Up");
Console.WriteLine($"{a.Number} {b.Number} {c.Number}, {Ticket.Issued} issued");
Console.WriteLine(Ticket.IsValidTitle(""));

class Ticket
{
    private static int s_next = 1;

    public static int Issued => s_next - 1;

    public Ticket(string film)
    {
        Film = film;
        Number = s_next;
        s_next++;
    }

    public string Film { get; }
    public int Number { get; }

    public static bool IsValidTitle(string title) => !string.IsNullOrWhiteSpace(title);
}
```

```text
1 2 3, 3 issued
False
```

There is one `s_next` for the whole program, so each ticket gets the next number. A static
method such as `IsValidTitle` has no `this`, so it cannot use instance members. A `static class`,
as in lesson 8, contains only static members and cannot be created with `new`. `Math` and
`Console` are static classes.

## Common mistakes

- **Public fields.** Expose properties so that the class keeps control of its data.
- **`value = value;` in a constructor.** Use `this.value` or a `_value` field. Watch for CS1717.
- **Expecting `=` to copy an object.** Both variables refer to the same object afterwards.
- **Comparing objects with `==`** to check their contents. For classes it checks identity.
- **Calling an instance member on the class**, as in `LibraryCard.Borrow(1)`. Create an object
  first, or make the member `static` if it needs no object data.

## Practice

1. Write a `Rectangle` class with a constructor taking width and height, read-only properties
   for both, and computed properties `Area` and `Perimeter`. Print them for 3 by 4.
2. Write an `Account` class with a read-only `Owner`, a `Balance` that only the class can change,
   `Deposit(decimal amount)`, and `Withdraw(decimal amount)` that returns `false` and changes
   nothing when the balance is too low.
3. Why is `first == other` false in the `Room` example, and what would make it true?

### Answers

**1. and 2.**

```csharp
var r = new Rectangle(3, 4);
Console.WriteLine($"{r.Area} {r.Perimeter}");
var account = new Account("Kai");
account.Deposit(50m);
account.Withdraw(20m);
Console.WriteLine($"{account.Owner}: {account.Balance:F2} {account.Withdraw(100m)}");

class Rectangle
{
    public Rectangle(double width, double height)
    {
        Width = width;
        Height = height;
    }

    public double Width { get; }
    public double Height { get; }
    public double Area => Width * Height;
    public double Perimeter => 2 * (Width + Height);
}

class Account
{
    public Account(string owner) => Owner = owner;

    public string Owner { get; }
    public decimal Balance { get; private set; }

    public void Deposit(decimal amount) => Balance += amount;

    public bool Withdraw(decimal amount)
    {
        if (amount > Balance)
        {
            return false;
        }
        Balance -= amount;
        return true;
    }
}
```

```text
12 14
Kai: 30.00 False
```

**3.** `first` and `other` are two different objects, and `==` on a class compares references.
Only `var other = first;` would make it true. Comparing the properties one by one, or the
records of a later level, compares contents.

## Key takeaways

- A class is a blueprint, and `new` creates objects from it. Each object has its own fields.
- Keep fields private. Properties control reading and writing, and can validate or compute.
- A constructor puts a new object into a valid state. Object initializers set properties after
  it.
- Class variables hold references. `static` members belong to the class and are shared.

## Further reading

- [Microsoft Learn: Classes](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/classes)
- [Microsoft Learn: Properties](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties)
- [Microsoft Learn: Object and collection initializers](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/object-and-collection-initializers)
