// A service may depend on services that live at least as long as itself.
var journal = new Journal();
var services = new Container();
services.Add<Journal>(Lifetime.Singleton, _ => journal);
services.Add<IClock>(Lifetime.Singleton, _ => new FixedClock(DateTimeOffset.UnixEpoch));
services.Add<DbSession>(Lifetime.Scoped, s => new DbSession(s.Get<Journal>()));
services.Add<SmsClient>(Lifetime.Transient, s => new SmsClient(s.Get<Journal>()));

// A singleton that needs a scoped service directly.
services.Add<SlotCache>(Lifetime.Singleton, s => new SlotCache(s.Get<DbSession>()));
Scope scope = services.CreateScope();
DbSession session = scope.Get<DbSession>();
Check.Throws<InvalidOperationException>(() => scope.Get<SlotCache>(),
    "a singleton whose factory asks for a scoped service, requested from a scope that already has one");
Check.Throws<InvalidOperationException>(() => services.CreateScope().Get<SlotCache>(),
    "a singleton whose factory asks for a scoped service, requested from a new scope");
Check.True(ReferenceEquals(scope.Get<DbSession>(), session), "the scope still gives its own scoped service after a refusal");

// A singleton that needs a scoped service through a transient one.
services.Add<ReminderService>(Lifetime.Transient,
    s => new ReminderService(s.Get<IClock>(), s.Get<DbSession>(), s.Get<SmsClient>()));
services.Add<AuditLog>(Lifetime.Singleton, s =>
{
    s.Get<ReminderService>();
    return new AuditLog(s.Get<Journal>());
});
Check.Throws<InvalidOperationException>(() => scope.Get<AuditLog>(),
    "a singleton whose factory asks for a transient service that needs a scoped one");
Check.True(scope.Get<ReminderService>() is not null, "the transient service itself still resolves in an ordinary scope");

// Longer-lived dependencies are fine.
var fine = new Container();
fine.Add<Journal>(Lifetime.Singleton, _ => journal);
fine.Add<IClock>(Lifetime.Singleton, _ => new FixedClock(DateTimeOffset.UnixEpoch));
fine.Add<SmsClient>(Lifetime.Transient, s => new SmsClient(s.Get<Journal>()));
fine.Add<AuditLog>(Lifetime.Singleton, s =>
{
    s.Get<IClock>();
    s.Get<SmsClient>();
    return new AuditLog(s.Get<Journal>());
});
fine.Add<DbSession>(Lifetime.Scoped, s =>
{
    s.Get<AuditLog>();
    return new DbSession(s.Get<Journal>());
});
Scope ok = fine.CreateScope();
Check.True(ok.Get<AuditLog>() is not null, "a singleton that needs another singleton and a transient service resolves");
Check.True(ok.Get<DbSession>() is not null, "a scoped service that needs a singleton resolves");
Check.True(ReferenceEquals(fine.CreateScope().Get<AuditLog>(), ok.Get<AuditLog>()), "that singleton is shared by every scope");
