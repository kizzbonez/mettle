---
title: Testing .NET Code
summary: Write unit tests with xUnit, NUnit or MSTest, replace dependencies with hand-written stubs, fakes and spies, test async code without waiting, and recognise the designs that make testing hard.
minutes: 30
objectives:
  - Write the same unit test in xUnit, NUnit and MSTest, following Arrange, Act, Assert and a clear naming scheme
  - Distinguish stubs, fakes and mocks or spies, and write each by hand
  - Test asynchronous code with `async Task` tests and controllable time instead of real delays
  - Identify statics, hidden I/O and other designs that make code hard to test, and name the seam that fixes each
---

## Outline

1. What a unit test is
2. Three frameworks, one test
3. Test doubles by hand
4. Testing async code
5. What makes code hard to test

## What a unit test is

A **unit test** runs one small piece of your code (a method or a class) in isolation and checks
the result automatically. It is fast (milliseconds), **isolated** (no database, network or file
system), **repeatable** (same result every run) and **self-checking** (it passes or fails with
no human judgement). An **integration test** checks several real components together, including
infrastructure, and is slower; you need both, in different numbers.

Microsoft's guidance for each test: structure it as **Arrange, Act, Assert** (set up, do the one
thing under test, check), name it after the method, the scenario and the expected behaviour
(`LateFee_TwoDaysLate_Returns15`), use the simplest inputs that prove the point, and keep logic
such as loops and `if` out of tests: when a test needs a loop, use a parameterised test instead.

## Three frameworks, one test

.NET has three established test frameworks, all run by `dotnet test` and all able to run on the
newer Microsoft.Testing.Platform as well as the older VSTest. They differ mainly in attribute
names. The same tests in each (they need the framework packages, so they do not run in the
sandbox):

```csharp
// xUnit: a class per area, a new instance per test, no special class attribute.
public class LateFeePolicyTests
{
    [Fact]
    public void LateFee_TwoDaysLate_Returns15() =>
        Assert.Equal(15m, Policy(new(2026, 4, 2)).LateFee(new DateOnly(2026, 3, 31)));

    [Theory]
    [InlineData(2026, 3, 30)]
    [InlineData(2026, 3, 31)]
    public void LateFee_OnOrBeforeDueDate_ReturnsZero(int y, int m, int d) =>
        Assert.Equal(0m, Policy(new(y, m, d)).LateFee(new DateOnly(2026, 3, 31)));

    static LateFeePolicy Policy(DateOnly today) =>
        new(new FixedClock(new DateTimeOffset(today, TimeOnly.MinValue, TimeSpan.Zero)));
}

// NUnit: [TestFixture] (optional), [Test], [TestCase], constraint-style asserts.
[Test] public void LateFee_TwoDaysLate_Returns15() =>
    Assert.That(Policy(new(2026, 4, 2)).LateFee(new DateOnly(2026, 3, 31)), Is.EqualTo(15m));

// MSTest: [TestClass], [TestMethod], [DataRow].
[TestMethod] public void LateFee_TwoDaysLate_Returns15() =>
    Assert.AreEqual(15m, Policy(new(2026, 4, 2)).LateFee(new DateOnly(2026, 3, 31)));
```

Note the argument order: xUnit's `Assert.Equal` and MSTest's `Assert.AreEqual` take the
**expected** value first, so swapping them produces confusing failure messages. NUnit's
`Assert.That(actual, Is.EqualTo(expected))` reads in the other direction. A parameterised test
(`[Theory]` with `[InlineData]`, `[TestCase]`, `[DataRow]`) runs once per data row and reports
each row separately.

## Test doubles by hand

A **test double** stands in for a real dependency during a test. The names are used loosely,
so be precise about what you mean:

- A **stub** returns canned answers so the code under test can run (a clock fixed at 9:00).
- A **fake** is a working but simplified implementation (an in-memory repository).
- A **mock** or **spy** records how it was called, and the test asserts on those calls (a mailer
  that remembers every message). Microsoft's guide adds that a double becomes a mock the moment
  you assert against it.

Libraries such as Moq or NSubstitute generate doubles, but writing them by hand takes a few lines
once your code depends on interfaces, and the result is easy to read:

```csharp
interface IClock { DateTimeOffset UtcNow { get; } }
interface IInvoiceStore { Task<IReadOnlyList<Invoice>> UnpaidAsync(); }
interface IMailer { Task SendAsync(string to, string subject); }
record Invoice(int Id, string Email, DateOnly Due);

sealed class ReminderJob(IClock clock, IInvoiceStore store, IMailer mailer)
{
    public async Task<int> RunAsync()
    {
        var today = DateOnly.FromDateTime(clock.UtcNow.UtcDateTime);
        int sent = 0;
        foreach (var invoice in await store.UnpaidAsync())
            if (invoice.Due < today) { await mailer.SendAsync(invoice.Email, $"Invoice {invoice.Id} is overdue"); sent++; }
        return sent;
    }
}

sealed class StubClock(DateTimeOffset now) : IClock { public DateTimeOffset UtcNow => now; }
sealed class FakeStore(params Invoice[] invoices) : IInvoiceStore
{
    public Task<IReadOnlyList<Invoice>> UnpaidAsync() => Task.FromResult<IReadOnlyList<Invoice>>(invoices);
}
sealed class SpyMailer : IMailer
{
    public List<(string To, string Subject)> Sent { get; } = [];
    public Task SendAsync(string to, string subject) { Sent.Add((to, subject)); return Task.CompletedTask; }
}

static class Tests
{
    static async Task Main()
    {
        // Arrange
        var mailer = new SpyMailer();
        var job = new ReminderJob(
            new StubClock(new DateTimeOffset(2026, 4, 2, 8, 0, 0, TimeSpan.Zero)),
            new FakeStore(new Invoice(7, "ada@example.com", new DateOnly(2026, 4, 1)),
                          new Invoice(8, "bo@example.com", new DateOnly(2026, 4, 2))),
            mailer);
        // Act
        int sent = await job.RunAsync();
        // Assert
        Console.WriteLine(sent == 1 && mailer.Sent.Single() == ("ada@example.com", "Invoice 7 is overdue")
            ? "PASS RunAsync_OneOverdueOneDueToday_RemindsOnlyTheOverdue" : "FAIL");
    }
}
```

```text
PASS RunAsync_OneOverdueOneDueToday_RemindsOnlyTheOverdue
```

## Testing async code

All three frameworks accept test methods that return `Task`: write `public async Task
Name()` and `await` inside, and the runner waits for the task and reports its exception.
Never write `async void` tests, because the runner has no task to wait for and a failure may be
missed, and never block with `.Result` or `.Wait()`. For expected exceptions, xUnit has
`await Assert.ThrowsAsync<T>(() => ...)`, and NUnit and MSTest have equivalents.

The hard part is **time**. A test that really waits for a retry back-off of 2, 4 and 8 seconds
is slow and flaky. Make the waiting a dependency, as with the clock: pass in a delay function, or
a `TimeProvider` (built into .NET 8 and later; the `Microsoft.Extensions.TimeProvider.Testing`
package adds a `FakeTimeProvider` whose clock the test advances by hand):

```csharp
static async Task<T> RetryAsync<T>(Func<Task<T>> action, int attempts, Func<TimeSpan, Task> delay)
{
    for (int attempt = 1; ; attempt++)
    {
        try { return await action(); }
        catch (TimeoutException) when (attempt < attempts)
        {
            await delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)));   // 2 s, 4 s, 8 s ...
        }
    }
}

var waits = new List<TimeSpan>();
int calls = 0;
string result = await RetryAsync(
    () => ++calls < 3 ? Task.FromException<string>(new TimeoutException()) : Task.FromResult("ok"),
    attempts: 5,
    delay: d => { waits.Add(d); return Task.CompletedTask; });
Console.WriteLine($"{result} after {calls} calls, waits: {string.Join(", ", waits)}");
```

```text
ok after 3 calls, waits: 00:00:02, 00:00:04
```

The test ran instantly, and it checks the back-off schedule exactly, which a test with real
delays could only estimate. In production, pass `Task.Delay`. To control the *order* in which
concurrent operations finish, hand the code a `TaskCompletionSource` and complete it from the
test, as this level's lab does with its gateway.

## What makes code hard to test

Each of these hides a dependency that a test cannot replace, and each has a **seam**, a place
where you can substitute behaviour without editing the code under test:

- **Static calls to the outside world**: `DateTime.Now`, `File.ReadAllText`, `Environment`.
  Seam: inject `TimeProvider` or a small interface.
- **`new` for collaborators** inside methods. Seam: constructor injection.
- **Global mutable state** (static caches, singletons reached through a static property): tests
  then affect each other. Seam: an instance passed in.
- **Work in constructors**, such as opening connections. Seam: a factory or an explicit
  `ConnectAsync`.
- **Long methods that decide and act at once**. Split the decision (pure, easy to test) from the
  side effect (thin, tested through a double).

Code coverage, the share of lines a test run executes, is a useful hint about untested areas,
but Microsoft warns against treating a high target as a measure of quality.

## Common mistakes

- Tests that depend on the clock, the order they run in, or each other's data.
- Asserting on implementation details (private methods, exact call counts that do not matter).
- Swapping expected and actual in `Assert.Equal`.
- `async void` tests, or `.Result` inside tests.
- Real `Task.Delay` and real network calls in unit tests.

## Practice

1. Name, in the Method_Scenario_Expected style, a test for `ParsePort("db01")` returning
   `null`.
2. `ReportService.Build()` calls `DateTime.Now` and writes to `C:\reports`. Name two seams to add.
3. Why can a test with `await Task.Delay(100)` followed by an assertion on a background result be
   flaky, and how do you make it deterministic?

### Answers

1. `ParsePort_HostWithoutPort_ReturnsNull`.
2. Inject a `TimeProvider` (or `IClock`) for the time, and an output abstraction such as a
   `Stream` or an `IReportWriter` for the file, so a test can pass a `MemoryStream` or a fake.
3. It assumes the background work finishes within 100 ms, which fails on a slow or busy
   machine. Await the work itself: have the code return a `Task`, or signal a
   `TaskCompletionSource` the test awaits.

## Key takeaways

- Fast, isolated, repeatable, self-checking; Arrange, Act, Assert; descriptive names.
- xUnit, NUnit and MSTest differ mostly in attributes; mind the expected and actual order.
- Stubs answer, fakes work, mocks and spies record; all are easy to write by hand.
- Async tests return `Task`; inject time instead of waiting.
- Hard-to-test code hides dependencies; add seams.

## Further reading

- [Best practices for writing unit tests](https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices)
- [Testing in .NET](https://learn.microsoft.com/en-us/dotnet/core/testing/)
- [Unit testing C# with xUnit](https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-csharp-with-xunit)
- [Unit testing C# with NUnit](https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-csharp-with-nunit)
