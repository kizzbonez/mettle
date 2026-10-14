// Back-Office Container
//
// A tiny dependency injection container for a clinic's reminder service:
// singleton, scoped and transient lifetimes, a check that refuses a scoped
// service inside a singleton (a captive dependency), and disposal of what each
// scope created, newest first.

public enum Lifetime { Singleton, Scoped, Transient }

/// <summary>How to build one service, and how long an instance lives.</summary>
public sealed record Registration(Lifetime Lifetime, Func<Scope, object> Factory);

/// <summary>The registrations, the singletons, and the root scope that builds and owns them.</summary>
public sealed class Container : IDisposable
{
    private readonly Dictionary<Type, Registration> _registrations = [];

    public Container() => Root = new Scope(this, isRoot: true);

    /// <summary>The scope that singletons are built with. It owns them, and refuses scoped services.</summary>
    internal Scope Root { get; }

    /// <summary>Singletons already built, by service type.</summary>
    internal Dictionary<Type, object> Singletons { get; } = [];

    /// <summary>Registers a service. A second registration of the same type replaces the first.</summary>
    public void Add<T>(Lifetime lifetime, Func<Scope, T> factory) where T : class =>
        _registrations[typeof(T)] = new Registration(lifetime, factory);

    /// <summary>The registration of a service type, or null if there is none.</summary>
    internal Registration? Find(Type type) => _registrations.GetValueOrDefault(type);

    /// <summary>A new scope, for example one per request.</summary>
    public Scope CreateScope() => new(this, isRoot: false);

    /// <summary>Disposes the singletons, and whatever else the root scope built.</summary>
    public void Dispose() => Root.Dispose();
}

/// <summary>Resolves services, and owns the instances whose factories it called.</summary>
public sealed class Scope : IDisposable
{
    private readonly Container _container;
    private readonly bool _isRoot;
    private readonly Dictionary<Type, object> _scoped = [];
    private readonly List<IDisposable> _owned = [];
    private bool _disposed;

    internal Scope(Container container, bool isRoot)
    {
        _container = container;
        _isRoot = isRoot;
    }

    /// <summary>An instance of <typeparamref name="T"/>, according to its lifetime.</summary>
    public T Get<T>() where T : class
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        Type type = typeof(T);
        Registration registration = _container.Find(type)
            ?? throw new InvalidOperationException($"No service is registered for {type.Name}.");

        switch (registration.Lifetime)
        {
            case Lifetime.Singleton:
                // Built with the root scope, whatever scope asked first.
                if (!_container.Singletons.TryGetValue(type, out object? single))
                    _container.Singletons[type] = single = _container.Root.Build(registration);
                return (T)single;

            case Lifetime.Scoped:
                // Only a singleton's factory ever holds the root scope.
                if (_isRoot)
                    throw new InvalidOperationException($"{type.Name} is scoped, and a singleton must not depend on it.");
                if (!_scoped.TryGetValue(type, out object? scoped))
                    _scoped[type] = scoped = Build(registration);
                return (T)scoped;

            default:
                return (T)Build(registration);
        }
    }

    /// <summary>Calls the factory with this scope, which then owns a disposable result.</summary>
    private object Build(Registration registration)
    {
        object instance = registration.Factory(this);
        if (instance is IDisposable disposable) _owned.Add(disposable);
        return instance;
    }

    /// <summary>Disposes what this scope built, newest first. A second call does nothing.</summary>
    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        for (int i = _owned.Count - 1; i >= 0; i--)
            _owned[i].Dispose();
        _owned.Clear();
    }
}

// ---- The services of the reminder service. The tests register these. ----

/// <summary>Remembers the order in which services were disposed.</summary>
public sealed class Journal
{
    public List<string> Disposed { get; } = [];
}

/// <summary>A service that holds something to release. It writes its name into the journal when disposed.</summary>
public abstract class Tracked(string name, Journal journal) : IDisposable
{
    public string Name { get; } = name;
    public int DisposeCount { get; private set; }

    public void Dispose()
    {
        DisposeCount++;
        journal.Disposed.Add(Name);
    }
}

/// <summary>A database session: one per request.</summary>
public sealed class DbSession(Journal journal) : Tracked("DbSession", journal);

/// <summary>A connection to the text-message gateway: cheap, a new one each time.</summary>
public sealed class SmsClient(Journal journal) : Tracked("SmsClient", journal);

/// <summary>The audit trail: one for the whole application.</summary>
public sealed class AuditLog(Journal journal) : Tracked("AuditLog", journal);

public interface IClock { DateTimeOffset UtcNow { get; } }

public sealed class FixedClock(DateTimeOffset now) : IClock
{
    public DateTimeOffset UtcNow => now;
}

/// <summary>Sends the reminders of one request.</summary>
public sealed record ReminderService(IClock Clock, DbSession Session, SmsClient Sms);

/// <summary>A cache of appointment slots, meant to live as long as the application.</summary>
public sealed record SlotCache(DbSession Session);
