---
title: Inheritance and Polymorphism
summary: Build a class hierarchy in which derived classes reuse and replace the behaviour of a base class, and call the right version of a method through a base-class variable.
minutes: 30
objectives:
  - Derive a class from a base class and chain its constructor to the base constructor with `base(...)`
  - Make a member replaceable with `virtual` or required with `abstract`, and replace it with `override`
  - Predict which method runs when a call goes through a base-class variable, with `override` and with `new`
  - Use `protected` and `sealed` to control what derived classes can see and do
---

## Outline

1. Base and derived classes
2. Constructors and `base`
3. `virtual`, `override` and polymorphism
4. `abstract` and `sealed`
5. Hiding with `new`, and casting

## Base and derived classes

**Inheritance** lets one class take over the members of another and add to them. The class you
start from is the **base class**; the new one is the **derived class**, written
`class Checking : Account`. A derived class *is a* kind of its base: a checking account is an
account, so a `Checking` object can be used anywhere an `Account` is expected. A class has exactly
one base class. If you name none, the base is `object` (`System.Object`), which is where every type
gets `ToString`, `Equals` and `GetHashCode`.

Use inheritance only for a real *is a* relationship. If one class merely *uses* another, give it a
field of that type instead; that is called **composition**, and it couples the classes far less.

## Constructors and `base`

Constructors are not inherited. Each derived constructor must first run a base constructor, chosen
with `: base(arguments)` after its parameter list. **`protected`** is the access modifier for
"this class and classes derived from it": outside code cannot use the member, derived classes can.

```csharp
var account = new Checking("Ada", 100m);
account.Deposit(40m);
Console.WriteLine(account.Summary());

class Account
{
    public Account(string owner)
    {
        Owner = owner;
        Console.WriteLine("Account constructor");
    }

    public string Owner { get; }
    public decimal Balance { get; protected set; }

    public void Deposit(decimal amount) => Balance += amount;
    public virtual string Summary() => $"{Owner}: {Balance}";
}

class Checking : Account
{
    public Checking(string owner, decimal overdraft) : base(owner)
    {
        Overdraft = overdraft;
        Console.WriteLine("Checking constructor");
    }

    public decimal Overdraft { get; }

    public override string Summary() => $"{base.Summary()} (overdraft {Overdraft})";
}
```

```text
Account constructor
Checking constructor
Ada: 40 (overdraft 100)
```

The base part of the object is built first, so a derived constructor can rely on it. `Checking`
inherits `Owner`, `Balance` and `Deposit` without writing them. Two mistakes the compiler catches:

```text
error CS7036: There is no argument given that corresponds to the required parameter 'owner' of 'Account.Account(string)'
error CS0272: The property or indexer 'Account.Balance' cannot be used in this context because the set accessor is inaccessible
```

The first comes from a derived constructor with no `: base(owner)`: C# then tries the base's
parameterless constructor, and `Account` has none. The second comes from `account.Balance = ...`
outside the hierarchy, where the `protected set` is invisible.

## `virtual`, `override` and polymorphism

A **virtual** member has a body that derived classes *may* replace. A derived class replaces it
with **`override`**, using exactly the same signature. Inside the override, `base.Summary()` calls
the base version, so `Checking` extends the text instead of rewriting it.

The point of all this is **polymorphism** ("many shapes"): a call made through a base-class variable
runs the version that belongs to the object's **run-time type**, the class it was really created
as, not the variable's **compile-time type**, the type the variable was declared with.

```csharp
List<Shape> shapes = [new Circle(1), new Rectangle(2, 3), new Square(2)];
foreach (Shape shape in shapes)
{
    Console.WriteLine(shape.Describe());
}

abstract class Shape
{
    public abstract double Area();          // no body: every derived class must supply one
    public virtual string Name => "shape";  // a body that derived classes may replace
    public string Describe() => $"{Name}, area {Area():0.##}";
}

class Circle : Shape
{
    private readonly double radius;
    public Circle(double radius) => this.radius = radius;

    public override double Area() => Math.PI * radius * radius;
    public override string Name => "circle";
}

class Rectangle : Shape
{
    protected readonly double width, height;
    public Rectangle(double width, double height)
    {
        this.width = width;
        this.height = height;
    }

    public override double Area() => width * height;
    public override string Name => "rectangle";
}

sealed class Square : Rectangle
{
    public Square(double side) : base(side, side) { }
    public override string Name => $"square, a {base.Name} {width}x{height}";
}
```

```text
circle, area 3.14
rectangle, area 6
square, a rectangle 2x2, area 4
```

`Describe` is written once, in `Shape`, and never changes. Each object brings its own `Area` and
`Name`. Adding a `Triangle` later needs no change to `Describe` or to the loop. Methods,
properties, indexers and events can be virtual; fields cannot.

## `abstract` and `sealed`

An **abstract class** is a base that is not complete on its own. It cannot be instantiated, and it
may declare **abstract members**: signatures with no body that every non-abstract derived class
must override. `Shape` has no sensible area of its own, so `Area` is abstract.

A **sealed class** cannot be derived from. Sealing `Square` says that its design is finished. An
override can also be sealed (`sealed override`) to stop further overriding of that one member.

```text
error CS0144: Cannot create an instance of the abstract type or interface 'Shape'
error CS0534: 'Triangle' does not implement inherited abstract member 'Shape.Area()'
error CS0509: 'Cube': cannot derive from sealed type 'Square'
```

These come from `new Shape()`, from a `Triangle : Shape` with no `Area`, and from
`class Cube : Square`.

## Hiding with `new`, and casting

A derived class can also declare a member with the same name as a non-virtual base member, marked
`new`. That **hides** the base member instead of overriding it, and the version that runs then
depends on the variable's compile-time type.

```csharp
Animal pet = new Dog();
Dog dog = (Dog)pet;   // same object, seen through a Dog variable
Console.WriteLine($"{pet.Sound()} {dog.Sound()}");
Console.WriteLine($"{pet.Name()} {dog.Name()}");

class Animal
{
    public virtual string Sound() => "...";
    public string Name() => "animal";
}

class Dog : Animal
{
    public override string Sound() => "woof";
    public new string Name() => "dog";
}
```

```text
woof woof
animal dog
```

One object, two answers from `Name`: that is why hiding is rarely what you want. If you forget
both `override` and `new` on a method that matches a virtual one, the compiler warns and hides:

```text
warning CS0114: 'Cat.Sound()' hides inherited member 'Animal.Sound()'. To make the current member override that implementation, add the override keyword. Otherwise add the new keyword.
```

Converting a `Dog` to `Animal` is implicit, because every dog is an animal. The other direction
needs an explicit cast, `(Dog)pet`, which throws `InvalidCastException` at run time if the object
is not really a `Dog`. Lesson 12 shows the safe test, `pet is Dog d`.

## Common mistakes

- **Treating the CS0114 warning as noise.** The method hides instead of overriding, and calls
  through the base type quietly run the old code. Add `override`.
- **Forgetting `virtual`.** A base method that is not virtual, abstract or itself an override
  cannot be overridden.
- **Deep hierarchies.** Each level couples every class below it. Two or three levels are plenty;
  prefer composition or interfaces.
- **Calling a virtual method from a base constructor.** It runs the derived override before the
  derived constructor has set its fields.

## Practice

1. Add a `Triangle(double b, double h)` to the shapes. What must it contain at minimum?
2. With `Account a = new Checking("Bo", 50m);`, what does `a.Summary()` print?
3. Why can `Square` use `width` but code in `Main` cannot?

### Answers

1. A constructor that stores the two values and `public override double Area() => 0.5 * b * h;`.
   `Name` is optional because it is virtual, not abstract; without it, the triangle describes
   itself as `shape`.
2. `Bo: 0 (overdraft 50)`, after the two constructor lines. The variable's type is `Account`, but
   `Summary` is virtual, so the `Checking` override runs.
3. `width` is `protected`: visible inside `Rectangle` and every class derived from it, invisible
   everywhere else.

## Key takeaways

- A derived class inherits its base's members, runs a base constructor first, and can add more.
- `virtual` allows and `abstract` demands an `override`; calls through a base variable run the
  override that belongs to the object's run-time type.
- `sealed` stops inheritance, `protected` opens members to derived classes only, and `new` hides
  rather than overrides.

## Further reading

- [Polymorphism (C# fundamentals)](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/polymorphism)
- [Inheritance (C# fundamentals)](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance)
- [C# reference: abstract](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/abstract)
