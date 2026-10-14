---
title: Events and the Observer Pattern
summary: Let one object notify any number of others without knowing who they are, using C# events and the standard `EventHandler<TEventArgs>` pattern, and avoid the leaks and surprises that come with forgotten subscriptions.
minutes: 25
objectives:
  - Declare an event with `EventHandler<TEventArgs>` and raise it through a protected `On...` method
  - Explain what code outside the class can and cannot do with an event, and why
  - Raise an event safely when there are no subscribers or a subscriber throws
  - Unsubscribe correctly and explain how a forgotten subscription keeps objects alive
---

## Outline

1. The observer pattern
2. Events are guarded delegates
3. The standard event pattern
4. Raising events safely
5. Unsubscribing, and the leaks it prevents
6. Async handlers

## The observer pattern

A freezer in a warehouse reports its temperature. An alarm wants to know when it gets too warm, a logger wants every reading, and next year a dashboard will want them too. If the freezer called each of them directly, it would have to change every time a new listener appeared. The **observer pattern** turns this around: the object that has news (the **publisher**, or subject) keeps a list of interested objects (the **subscribers**, or observers) and notifies whoever is on the list, without knowing what they are. Subscribers add and remove themselves.

C# builds this pattern into the language as the **event**.

## Events are guarded delegates

You met multicast delegates in the medium level: `+=` adds a method to a delegate's invocation list, and invoking the delegate calls each one in order. A public delegate *field* would already be a list of subscribers, but anyone could also call it or overwrite it with `=`, wiping out every other subscriber.

Adding the `event` keyword keeps the list and removes the danger. Outside the declaring class, an event supports only `+=` and `-=`. Only the class itself can raise it or replace it.

```csharp
var freezer = new Freezer("F-12");
freezer.TemperatureChanged(freezer, new TemperatureChangedEventArgs(4));
freezer.TemperatureChanged = null;
```

```text
error CS0070: The event 'Freezer.TemperatureChanged' can only appear on the left hand side of += or -= (except when used from within the type 'Freezer')
error CS0070: The event 'Freezer.TemperatureChanged' can only appear on the left hand side of += or -= (except when used from within the type 'Freezer')
```

Behind the scenes a **field-like event** (declared like a field, as below) gives you a private delegate field plus public `add` and `remove` accessors, much as an auto-property gives you a field plus `get` and `set`. You can also write the accessors yourself, for example to store handlers somewhere else.

## The standard event pattern

.NET events follow one shape so that every subscriber knows what to expect:

- The delegate type is `EventHandler` or `EventHandler<TEventArgs>`: a method returning `void` that takes `object? sender` (who raised it) and the event data.
- The data is a class, by convention derived from `EventArgs` and named `...EventArgs`, with read-only properties so that one subscriber cannot change what the next one sees. With no data, pass `EventArgs.Empty`.
- The event is named for what happened (`TemperatureChanged`, `Closed`), and a `protected virtual void On...` method raises it, so derived classes can hook in.

```csharp
var freezer = new Freezer("F-12");
var alarm = new Alarm();
freezer.TemperatureChanged += alarm.OnTemperatureChanged;
freezer.TemperatureChanged += (sender, e) => Console.WriteLine($"log: {e.Celsius} C");

freezer.Report(-18);
freezer.Report(-9);

public sealed class TemperatureChangedEventArgs(double celsius) : EventArgs
{
    public double Celsius { get; } = celsius;
}

public class Freezer(string name)
{
    public string Name { get; } = name;

    public event EventHandler<TemperatureChangedEventArgs>? TemperatureChanged;

    public void Report(double celsius) => OnTemperatureChanged(new TemperatureChangedEventArgs(celsius));

    protected virtual void OnTemperatureChanged(TemperatureChangedEventArgs e) =>
        TemperatureChanged?.Invoke(this, e);
}

public sealed class Alarm
{
    public void OnTemperatureChanged(object? sender, TemperatureChangedEventArgs e)
    {
        if (e.Celsius > -12 && sender is Freezer freezer)
            Console.WriteLine($"ALARM: {freezer.Name} is at {e.Celsius} C");
    }
}
```

```text
log: -18 C
ALARM: F-12 is at -9 C
log: -9 C
```

Handlers run one after another, in the order they subscribed, on the thread that raised the event. Raising an event is an ordinary synchronous method call.

## Raising events safely

Two things can go wrong when you raise an event.

**Nobody is listening.** With no subscribers the delegate field is `null`, so `TemperatureChanged(this, e)` would throw `NullReferenceException`. That is why the event is declared nullable and raised with `?.Invoke`. The `?.` operator also reads the field only once. A version that checks `if (TemperatureChanged != null)` and then reads it again can fail if another thread removes the last handler between the two reads.

**A subscriber throws.** The exception stops the loop: later subscribers are not called, and the exception comes out of `Report`, in the publisher's code. If the publisher must reach every subscriber, it can call them one by one through `GetInvocationList()` and catch each failure (practice 2).

## Unsubscribing, and the leaks it prevents

A delegate holds a reference to its target object. So a publisher holds a reference to every subscriber in its list, and as long as the publisher is alive, the garbage collector cannot reclaim them. A long-lived publisher (an application-wide service) with short-lived subscribers (screens, requests) that never unsubscribe is a classic **memory leak** in .NET: the subscribers pile up and keep receiving events they should not.

```csharp
var belt = new ConveyorBelt();
for (int shift = 1; shift <= 3; shift++)
{
    var screen = new Screen($"screen {shift}");
    belt.ItemPassed += screen.Show; // subscribed, never removed
}
belt.Move("crate");
Console.WriteLine($"handlers: {belt.HandlerCount}");

EventHandler<string> counter = (sender, item) => Console.WriteLine($"counted {item}");
belt.ItemPassed += counter;
belt.ItemPassed -= (sender, item) => Console.WriteLine($"counted {item}");
Console.WriteLine($"after removing a new lambda: {belt.HandlerCount}");
belt.ItemPassed -= counter;
Console.WriteLine($"after removing the stored one: {belt.HandlerCount}");

public sealed class ConveyorBelt
{
    public event EventHandler<string>? ItemPassed;

    public int HandlerCount => ItemPassed?.GetInvocationList().Length ?? 0;

    public void Move(string item) => ItemPassed?.Invoke(this, item);
}

public sealed class Screen(string name)
{
    public void Show(object? sender, string item) => Console.WriteLine($"{name}: {item}");
}
```

```text
screen 1: crate
screen 2: crate
screen 3: crate
handlers: 3
after removing a new lambda: 4
after removing the stored one: 3
```

The three screens went out of scope in the loop, yet all three still receive items: the belt keeps them alive. The second half shows the usual unsubscribing bug. `-=` removes a delegate *equal* to the one given, and two lambdas written separately are different delegates even when their text is identical. Removing a fresh lambda silently does nothing. Keep the delegate you subscribed in a variable or field, or subscribe a named method, and remove that. (`EventHandler<string>` works because `TEventArgs` no longer has to derive from `EventArgs`.)

The rule: whoever subscribes is responsible for unsubscribing, usually when it is disposed (lesson 5). An object that subscribes to its own events, or to a publisher that dies with it, does not need to.

## Async handlers

An event handler must return `void`, so an async handler is `async void`: the publisher cannot await it and does not know when it finishes. `Report` returns as soon as each handler reaches its first incomplete `await`. Exceptions thrown after that point do not reach the publisher; they are unhandled and can crash the process. Wrap the body of an async handler in `try`/`catch`. If the publisher needs to wait for its listeners, events are the wrong tool: let subscribers register a `Func<T, Task>` that the publisher awaits.

## Common mistakes

- **Raising with `TemperatureChanged(this, e)`** instead of `?.Invoke`, which throws when there are no subscribers.
- **Unsubscribing with a new lambda**, which removes nothing.
- **Never unsubscribing** from a publisher that outlives the subscriber.
- **Mutable event arguments** that one handler changes before the next sees them (unless, like a `Cancel` flag, that is the point).

## Practice

1. Add an event `Defrosted` with no data to `Freezer`, and a `Defrost()` method that raises it.
2. Write `MoveSafely(string item)` for `ConveyorBelt` that calls every handler even if one throws, printing `a handler failed: ...` for each failure.
3. A settings window subscribes to `App.ThemeChanged` (a static event) in its constructor. Users open and close it many times, and memory grows. Why, and what is the fix?

### Answers

1. `public event EventHandler? Defrosted;` and `public void Defrost() => Defrosted?.Invoke(this, EventArgs.Empty);`
2. Each delegate in the invocation list is called on its own:

   ```csharp
   public void MoveSafely(string item)
   {
       if (ItemPassed is not { } handlers) return;
       foreach (EventHandler<string> handler in handlers.GetInvocationList())
       {
           try { handler(this, item); }
           catch (Exception e) { Console.WriteLine($"a handler failed: {e.Message}"); }
       }
   }
   ```

3. A static event lives as long as the program, and each window it lists stays reachable through it, even after closing. Unsubscribe when the window closes (`App.ThemeChanged -= OnThemeChanged;`), using the same named method that was subscribed.

## Key takeaways

- An event is a delegate list that outsiders can only add to and remove from.
- Use `EventHandler<TEventArgs>`, immutable event data, and a `protected virtual On...` method.
- Raise with `?.Invoke`; a throwing handler stops the rest unless you loop yourself.
- A publisher keeps its subscribers alive. Unsubscribe with the same delegate you subscribed.
- `async void` handlers cannot be awaited; catch their exceptions inside.

## Further reading

- [Microsoft Learn: Standard .NET event patterns](https://learn.microsoft.com/en-us/dotnet/csharp/event-pattern)
- [Microsoft Learn: Async return types (the void return type and event handlers)](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-return-types)
