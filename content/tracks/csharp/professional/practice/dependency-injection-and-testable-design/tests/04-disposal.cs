// Each scope disposes what it owns, newest first, once.
var journal = new Journal();
var services = new Container();
services.Add<Journal>(Lifetime.Singleton, _ => journal);
services.Add<DbSession>(Lifetime.Scoped, s => new DbSession(s.Get<Journal>()));
services.Add<SmsClient>(Lifetime.Transient, s => new SmsClient(s.Get<Journal>()));
services.Add<AuditLog>(Lifetime.Singleton, s => new AuditLog(s.Get<Journal>()));

Scope request = services.CreateScope();
DbSession session = request.Get<DbSession>();
SmsClient sms = request.Get<SmsClient>();
AuditLog audit = request.Get<AuditLog>();
request.Get<DbSession>();

request.Dispose();
Check.SequenceEqual(journal.Disposed, ["SmsClient", "DbSession"], "what a scope disposed: its own instances, newest first");
Check.Equal((session.DisposeCount, sms.DisposeCount), (1, 1), "how often the scope's instances were disposed");
Check.Equal(audit.DisposeCount, 0, "a scope does not dispose a singleton, even one it asked for first");

request.Dispose();
Check.Equal((session.DisposeCount, sms.DisposeCount), (1, 1), "how often the scope's instances were disposed after a second Dispose");
Check.Throws<ObjectDisposedException>(() => request.Get<SmsClient>(), "Get of a transient service on a disposed scope");
Check.Throws<ObjectDisposedException>(() => request.Get<DbSession>(), "Get of a scoped service on a disposed scope");

// Other scopes are not affected.
Scope other = services.CreateScope();
DbSession otherSession = other.Get<DbSession>();
Scope third = services.CreateScope();
third.Get<SmsClient>();
third.Dispose();
Check.Equal(otherSession.DisposeCount, 0, "disposing one scope leaves another scope's instances alone");
Check.True(ReferenceEquals(other.Get<DbSession>(), otherSession), "a scope keeps working after another scope was disposed");

// The container disposes the singletons, and the transients built for them.
journal.Disposed.Clear();
var app = new Container();
app.Add<Journal>(Lifetime.Singleton, _ => journal);
app.Add<SmsClient>(Lifetime.Transient, s => new SmsClient(s.Get<Journal>()));
app.Add<DbSession>(Lifetime.Scoped, s => new DbSession(s.Get<Journal>()));
SmsClient? builtForAudit = null;
app.Add<AuditLog>(Lifetime.Singleton, s =>
{
    builtForAudit = s.Get<SmsClient>();
    return new AuditLog(s.Get<Journal>());
});

Scope morning = app.CreateScope();
morning.Get<DbSession>();
AuditLog log = morning.Get<AuditLog>();
morning.Dispose();
Check.SequenceEqual(journal.Disposed, ["DbSession"], "a scope does not dispose a transient that was built for a singleton");

Scope evening = app.CreateScope();
DbSession late = evening.Get<DbSession>();
app.Dispose();
Check.SequenceEqual(journal.Disposed, ["DbSession", "AuditLog", "SmsClient"],
    "what the container disposed: the singleton, then the transient built before it for it");
Check.Equal((log.DisposeCount, builtForAudit!.DisposeCount), (1, 1), "how often the container disposed what its root owns");
Check.Equal(late.DisposeCount, 0, "the container does not dispose a scope's instances; the scope does");
evening.Dispose();
Check.Equal(late.DisposeCount, 1, "the scope disposes its own instance afterwards");
