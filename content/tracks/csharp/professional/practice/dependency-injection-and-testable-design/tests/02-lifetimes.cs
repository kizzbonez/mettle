// Each lifetime, with a count of how often its factory ran.
var journal = new Journal();
int clocks = 0, sessions = 0, clients = 0;
var services = new Container();
services.Add<Journal>(Lifetime.Singleton, _ => journal);
services.Add<IClock>(Lifetime.Singleton, _ => { clocks++; return new FixedClock(DateTimeOffset.UnixEpoch); });
services.Add<DbSession>(Lifetime.Scoped, s => { sessions++; return new DbSession(s.Get<Journal>()); });
services.Add<SmsClient>(Lifetime.Transient, s => { clients++; return new SmsClient(s.Get<Journal>()); });
services.Add<ReminderService>(Lifetime.Transient,
    s => new ReminderService(s.Get<IClock>(), s.Get<DbSession>(), s.Get<SmsClient>()));

Scope first = services.CreateScope();
Scope second = services.CreateScope();

// Singleton: built once, whichever scope asks first.
IClock clock = second.Get<IClock>();
Check.True(ReferenceEquals(first.Get<IClock>(), clock), "two scopes get the same singleton");
Check.True(ReferenceEquals(second.Get<IClock>(), clock), "a scope asking again gets the same singleton");
Check.Equal(clocks, 1, "calls of a singleton's factory after five requests from two scopes");

// Scoped: once per scope.
DbSession one = first.Get<DbSession>();
Check.True(ReferenceEquals(first.Get<DbSession>(), one), "a scope asking again gets its own scoped instance");
DbSession two = second.Get<DbSession>();
Check.True(!ReferenceEquals(one, two), "two scopes get two scoped instances");
Check.True(ReferenceEquals(second.Get<DbSession>(), two), "the second scope keeps its scoped instance");
Check.Equal(sessions, 2, "calls of a scoped factory after requests from two scopes");

// Transient: every time.
SmsClient x = first.Get<SmsClient>(), y = first.Get<SmsClient>(), z = second.Get<SmsClient>();
Check.True(!ReferenceEquals(x, y) && !ReferenceEquals(y, z) && !ReferenceEquals(x, z), "every Get of a transient service is a new instance");
Check.Equal(clients, 3, "calls of a transient factory after three requests");

// A service built from all three.
ReminderService service = first.Get<ReminderService>();
Check.True(ReferenceEquals(service.Clock, clock), "a service built in a scope receives the singleton");
Check.True(ReferenceEquals(service.Session, one), "a service built in a scope receives that scope's scoped instance");
Check.True(!ReferenceEquals(service.Sms, x) && !ReferenceEquals(service.Sms, y), "a service built in a scope receives a new transient");
Check.Equal(clients, 4, "calls of the transient factory after a service needed one more");

// A disposed scope does not take the singleton with it.
first.Dispose();
Check.True(ReferenceEquals(services.CreateScope().Get<IClock>(), clock), "a new scope gets the same singleton after another scope was disposed");
Check.Equal(clocks, 1, "calls of the singleton's factory after a scope was disposed");

// Unregistered services.
string? message = null;
try
{
    second.Get<SlotCache>();
}
catch (InvalidOperationException error)
{
    message = error.Message;
}
Check.True(message is not null, "asking for a service that is not registered throws InvalidOperationException");
Check.True(message!.Contains(nameof(SlotCache)), "the message for a service that is not registered names the type");

// A second registration replaces the first.
var replaced = new Container();
replaced.Add<IClock>(Lifetime.Singleton, _ => new FixedClock(DateTimeOffset.UnixEpoch));
replaced.Add<IClock>(Lifetime.Singleton, _ => new FixedClock(DateTimeOffset.MaxValue));
Check.Equal(replaced.CreateScope().Get<IClock>().UtcNow, DateTimeOffset.MaxValue, "the clock built from the last registration");
