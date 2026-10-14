---
title: Dependency Injection and Testable Design
summary: Pass dependencies in instead of creating them, choose the right lifetime for each service, and see how a container works by building a small one before meeting the one in .NET.
minutes: 30
objectives:
  - Explain inversion of control and refactor a class from hard-wired dependencies to constructor injection
  - Define singleton, scoped and transient lifetimes and spot a captive dependency
  - Register and resolve services with Microsoft.Extensions.DependencyInjection and say what the container disposes
  - Weigh the costs of injection, abstraction and the service locator pattern
---

## Outline

1. The problem with `new`
2. Inversion of control and constructor injection
3. The composition root
4. Lifetimes
5. A container by hand
6. The .NET container
7. Costs and anti-patterns

## The problem with `new`

A **dependency** is an object that another object needs to do its job: a clock, a database, an
HTTP client, a logger. A class that creates its own dependencies, or reaches for static ones such
as `DateTime.UtcNow` or `File`, is **hard-wired** to them:

```csharp
static class LateFees
{
    public static decimal For(DateOnly due) =>
        DateOnly.FromDateTime(DateTime.UtcNow) > due ? 15m : 0m;
}
```

To test "a payment two days late costs 15" you would have to wait for the right day. To use a
different clock (a time zone, a business calendar) you would have to edit the class. And when a
dependency has dependencies of its own, every class that creates it must know how to build them
too.

## Inversion of control and constructor injection

**Inversion of control** means a class no longer decides which implementation it uses; something
outside decides and hands it in. The **dependency inversion principle** adds that the class
should depend on an abstraction (an interface it needs), not on a concrete class. The usual form
in C# is **constructor injection**: every dependency is a constructor parameter, so the class
cannot exist without them and its needs are visible in one place.

```csharp
interface IClock { DateTimeOffset UtcNow { get; } }

sealed class LateFeePolicy(IClock clock)
{
    public decimal LateFee(DateOnly due) =>
        DateOnly.FromDateTime(clock.UtcNow.UtcDateTime) > due ? 15m : 0m;
}

sealed class FixedClock(DateTimeOffset now) : IClock
{
    public DateTimeOffset UtcNow => now;
}

static class Program
{
    static void Main()
    {
        var due = new DateOnly(2026, 3, 31);
        var late = new LateFeePolicy(new FixedClock(new DateTimeOffset(2026, 4, 2, 9, 0, 0, TimeSpan.Zero)));
        var onTime = new LateFeePolicy(new FixedClock(new DateTimeOffset(2026, 3, 31, 23, 0, 0, TimeSpan.Zero)));
        Console.WriteLine($"two days late: {late.LateFee(due)}, on the due date: {onTime.LateFee(due)}");
    }
}
```

```text
two days late: 15, on the due date: 0
```

The policy now works with any clock. Production passes one that reads the system time; the test
passes a fixed one. (.NET 8 and later also ship an abstract `TimeProvider` class for exactly this
purpose, so you often need not write `IClock` yourself.)

## The composition root

If every class receives its dependencies, somebody must create them. That place is the
**composition root**: one spot at application start-up, usually `Program.cs`, where the object
graph is wired together. Only the composition root knows concrete types; everything else knows
interfaces. You can write it by hand with `new`, and for small programs that is a fine choice. A
**DI container** automates it: you register which implementation serves which type, and it
builds objects and their dependencies on request.

## Lifetimes

A container also decides how long each object lives. There are three **lifetimes**:

- **Singleton**: one instance for the whole application, created on first request. It must be
  thread-safe, because every request shares it.
- **Scoped**: one instance per **scope**, which in a web app is one request. Database contexts
  are typically scoped: shared within a request, never across requests.
- **Transient**: a new instance every time one is requested.

The rule that follows: a service may depend on services that live **at least as long** as
itself. A singleton that takes a scoped service in its constructor keeps the first scope's
instance forever. This bug is called a **captive dependency**.

## A container by hand

A container is less magic than it looks. This one stores a factory and a lifetime per type, and
caches instances in the right place:

```csharp
var services = new Container();
services.Add<IClock>(Lifetime.Singleton, _ => new SystemClock());
services.Add<RequestLog>(Lifetime.Scoped, _ => new RequestLog());
services.Add<Invoicer>(Lifetime.Transient, s => new Invoicer(s.Get<IClock>(), s.Get<RequestLog>()));
services.Add<ReportCache>(Lifetime.Singleton, s => new ReportCache(s.Get<RequestLog>())); // a mistake

var first = services.CreateScope();
Invoicer a = first.Get<Invoicer>(), b = first.Get<Invoicer>();
Console.WriteLine($"transient, same Invoicer:          {ReferenceEquals(a, b)}");
Console.WriteLine($"scoped, same log within a scope:   {ReferenceEquals(a.Log, b.Log)}");
Console.WriteLine($"singleton, same clock:             {ReferenceEquals(a.Clock, b.Clock)}");
var second = services.CreateScope();
Console.WriteLine($"scoped, same log across scopes:    {ReferenceEquals(a.Log, second.Get<Invoicer>().Log)}");
first.Get<ReportCache>();
Console.WriteLine($"captive: 2nd scope sees 1st's log: {ReferenceEquals(second.Get<ReportCache>().Log, a.Log)}");

enum Lifetime { Singleton, Scoped, Transient }

sealed class Container
{
    private readonly Dictionary<Type, (Lifetime Life, Func<Scope, object> Make)> _map = new();
    private readonly Dictionary<Type, object> _singletons = new();

    public void Add<T>(Lifetime life, Func<Scope, T> make) where T : class => _map[typeof(T)] = (life, make);
    public Scope CreateScope() => new(this);

    public sealed class Scope(Container root)
    {
        private readonly Dictionary<Type, object> _scoped = new();

        public T Get<T>() where T : class
        {
            var (life, make) = root._map[typeof(T)];
            Dictionary<Type, object>? cache = life switch
            {
                Lifetime.Singleton => root._singletons,
                Lifetime.Scoped => _scoped,
                _ => null,                         // transient: never cached
            };
            if (cache is null) return (T)make(this);
            if (!cache.TryGetValue(typeof(T), out object? instance))
                cache[typeof(T)] = instance = make(this);
            return (T)instance;
        }
    }
}

interface IClock { DateTimeOffset UtcNow { get; } }
sealed class SystemClock : IClock { public DateTimeOffset UtcNow => DateTimeOffset.UtcNow; }
sealed class RequestLog { }
sealed record Invoicer(IClock Clock, RequestLog Log);
sealed record ReportCache(RequestLog Log);
```

```text
transient, same Invoicer:          False
scoped, same log within a scope:   True
singleton, same clock:             True
scoped, same log across scopes:    False
captive: 2nd scope sees 1st's log: True
```

The last line is the captive dependency: the singleton `ReportCache` was built inside the first
scope and kept that scope's `RequestLog`, so the second request sees the first request's data.
This toy container is not thread-safe and does not dispose anything; the real one does both.

## The .NET container

`Microsoft.Extensions.DependencyInjection` is the container that ASP.NET Core, worker services
and the generic host use. It is a NuGet package, so this fragment, based on the documentation's
examples, does not run in the sandbox:

```csharp
var services = new ServiceCollection();
services.AddSingleton<TimeProvider>(TimeProvider.System);
services.AddScoped<IOrderRepository, SqlOrderRepository>();
services.AddTransient<InvoiceService>();

using ServiceProvider provider = services.BuildServiceProvider(validateScopes: true);
using (IServiceScope scope = provider.CreateScope())
{
    var invoices = scope.ServiceProvider.GetRequiredService<InvoiceService>();
}   // scoped and transient disposables created in this scope are disposed here
```

What to know about it:

- It picks the public constructor with the most parameters it can satisfy, and throws if two
  are equally good.
- Registering the same service type twice: a single resolve gets the **last** registration,
  while asking for `IEnumerable<T>` gets all of them in order. `TryAdd...` registers only if
  nothing is registered yet, which is how libraries supply overridable defaults.
- It disposes the `IDisposable` objects it created, at the end of their scope or when the root
  provider is disposed. It does not dispose an instance you created and passed in.
- With `validateScopes: true` (on by default in the Development environment when you use the
  host), it refuses scoped services from the root provider and scoped services inside
  singletons, catching captive dependencies at start-up.

## Costs and anti-patterns

Injection is not free. Every interface is one more file and one more indirection to follow, so
introduce one when there is a second implementation or a test that needs it, not by reflex. A
constructor with eight parameters is a sign the class does too much. And avoid the **service
locator** pattern: passing `IServiceProvider` around and calling `GetService` inside methods
hides dependencies again, which is the problem injection was meant to solve.

## Common mistakes

- `new` for collaborators deep inside business code, or static calls to the clock and file system.
- Injecting a scoped service into a singleton.
- Disposing a service you received from the container.
- Calling `BuildServiceProvider` while still registering services.
- An interface for every class, with exactly one implementation and no tests that need another.

## Practice

1. `OrderService` calls `new SmtpMailer()` inside `PlaceOrder`. Rewrite its shape so a test can
   check that one confirmation is sent per order.
2. A singleton `PriceCache` needs a scoped `AppDbContext` to reload prices every hour. How do
   you give it database access without a captive dependency?
3. Which lifetime fits each: an in-memory exchange rate cache, a per-request shopping basket, a
   small stateless validator?

### Answers

1. Declare `interface IMailer { void Send(string to, string body); }`, give `OrderService` a
   constructor parameter `IMailer mailer`, and call `mailer.Send(...)`. The test passes a fake
   that records calls and asserts one call per order; production registers `SmtpMailer` as
   `IMailer`.
2. Inject `IServiceScopeFactory` (a singleton) instead. On each reload,
   `using var scope = scopeFactory.CreateScope();` and resolve `AppDbContext` from
   `scope.ServiceProvider`. The context lives and dies with that scope.
3. Singleton (shared, made thread-safe), scoped (one per request), transient (cheap, no state).

## Key takeaways

- Take dependencies through the constructor and depend on what you need, not how it is built.
- Wire the object graph in one composition root.
- Singleton, scoped and transient; a service may only depend on longer-or-equal lifetimes.
- The container disposes what it creates; turn on scope validation.
- Abstractions cost something: add them where a second implementation or a test needs them.

## Further reading

- [Dependency injection in .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/overview)
- [Service lifetimes](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/service-lifetimes)
- [Dependency injection guidelines](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines)
- [Service registration](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/service-registration)
