`Container` is written. `Add<T>` registers a factory and a lifetime for a service type (a second
registration of the same type replaces the first), `CreateScope` makes a scope, `Find` looks up
a registration, and `Singletons` holds the singletons built so far. `Root` is a special scope:
**every singleton is built with it**, and it owns them. `Container.Dispose` disposes `Root`.

Write the two methods of `Scope`. A scope is used from one thread at a time.

1. `T Get<T>()` returns an instance of `T`.
   - If `T` has no registration, throw `InvalidOperationException` with a message that names
     the type (`typeof(T).Name`).
   - **Singleton**: one instance for the whole container. If there is none yet in
     `Singletons`, build it by calling the factory **with `Root`**, whichever scope asked, and
     store it. Return the stored one.
   - **Scoped**: one instance per scope, built by calling the factory with this scope the first
     time this scope is asked.
   - **Transient**: a new instance on every call, built with this scope.
   - **The root scope refuses scoped services**: asking `Root` for a scoped service throws
     `InvalidOperationException`. Only a singleton's factory ever holds `Root`, so this is the
     check that stops a singleton from capturing one request's service for ever (a captive
     dependency). A transient built for a singleton is built with `Root` too, so it is
     refused the same way.
   - Asking a scope that has been disposed throws `ObjectDisposedException`.
2. `void Dispose()` disposes what this scope owns.
   - A scope **owns** every instance whose factory it called and that implements
     `IDisposable`: scoped and transient ones for an ordinary scope, singletons (and the
     transients built for them) for `Root`.
   - It disposes them in the **reverse** of the order in which their factories returned:
     newest first, because a newer service may still use an older one while it shuts down.
   - A second `Dispose` does nothing. Instances owned by another scope are not touched.

The services at the end of the file are for the tests. `Tracked` writes its `Name` into a
`Journal` when it is disposed and counts its `Dispose` calls.

Example:

```csharp
var journal = new Journal();
var services = new Container();
services.Add<Journal>(Lifetime.Singleton, _ => journal);
services.Add<IClock>(Lifetime.Singleton, _ => new FixedClock(DateTimeOffset.UnixEpoch));
services.Add<DbSession>(Lifetime.Scoped, s => new DbSession(s.Get<Journal>()));
services.Add<SmsClient>(Lifetime.Transient, s => new SmsClient(s.Get<Journal>()));
services.Add<ReminderService>(Lifetime.Transient,
    s => new ReminderService(s.Get<IClock>(), s.Get<DbSession>(), s.Get<SmsClient>()));
services.Add<SlotCache>(Lifetime.Singleton, s => new SlotCache(s.Get<DbSession>()));   // a mistake

Scope morning = services.CreateScope();
ReminderService a = morning.Get<ReminderService>(), b = morning.Get<ReminderService>();
ReferenceEquals(a, b)                     // false: transient
ReferenceEquals(a.Session, b.Session)     // true: one DbSession per scope
ReferenceEquals(a.Clock, b.Clock)         // true: one clock for the container

Scope evening = services.CreateScope();
ReferenceEquals(a.Session, evening.Get<ReminderService>().Session)   // false
evening.Get<SlotCache>()                  // throws InvalidOperationException: captive dependency

morning.Dispose();
journal.Disposed                          // ["SmsClient", "SmsClient", "DbSession"]
morning.Get<ReminderService>()            // throws ObjectDisposedException
```

**Tips**

- Call the factory in one place, a small private method that also remembers a disposable
  result. `Root` is a `Scope` too, so it can call that method on itself.
- A `Dictionary<Type, object>` per scope holds its scoped instances; a `List<IDisposable>`
  holds what it owns, in the order the factories returned.
- `ObjectDisposedException.ThrowIf(disposed, this)` is the one-line check.
