// The example from the instructions.
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
Check.True(!ReferenceEquals(a, b), "a transient service is a new instance on every Get");
Check.True(ReferenceEquals(a.Session, b.Session), "a scoped service is one instance within a scope");
Check.True(ReferenceEquals(a.Clock, b.Clock), "a singleton is one instance for the container");

Scope evening = services.CreateScope();
Check.True(!ReferenceEquals(a.Session, evening.Get<ReminderService>().Session), "each scope has its own scoped service");
Check.Throws<InvalidOperationException>(() => evening.Get<SlotCache>(), "a singleton that depends on a scoped service is refused");

morning.Dispose();
Check.SequenceEqual(journal.Disposed, ["SmsClient", "SmsClient", "DbSession"], "what the morning scope disposed, in order");
Check.Throws<ObjectDisposedException>(() => morning.Get<ReminderService>(), "Get on a scope that has been disposed");
