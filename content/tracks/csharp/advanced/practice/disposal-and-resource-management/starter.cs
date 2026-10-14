// Stage Lights
//
// A scene owns the spotlights it switches on and must switch them off, newest
// first, when it is disposed; the house lights it was handed are not its to
// switch off. A cue book saves its notes asynchronously when it is closed.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// A light that is on from the moment it is created until it is disposed.
public sealed class Lamp : IDisposable
{
    private readonly List<string> _log;

    public Lamp(string name, List<string> log)
    {
        Name = name;
        _log = log;
        log.Add($"on {name}");
    }

    public string Name { get; }

    public bool IsOn { get; private set; } = true;

    public void Dispose()
    {
        if (!IsOn) return;
        IsOn = false;
        _log.Add($"off {Name}");
    }
}

/// One scene: the spotlights it switches on are its own, the house lights are not.
public sealed class Scene : IDisposable
{
    private readonly List<string> _log;

    // TODO: add the fields you need

    public Scene(Lamp houseLights, List<string> log)
    {
        HouseLights = houseLights;
        _log = log;
    }

    public Lamp HouseLights { get; }

    /// Switches on a new spotlight that belongs to this scene.
    public Lamp Spot(string name)
    {
        // TODO 1
        throw new NotImplementedException();
    }

    /// Switches off every spotlight of this scene, newest first.
    public void Dispose()
    {
        // TODO 2
        throw new NotImplementedException();
    }
}

/// The stage manager's cues, saved when the book is closed.
public sealed class CueBook : IAsyncDisposable
{
    private readonly Func<IReadOnlyList<string>, Task> _save;

    // TODO: add the fields you need

    public CueBook(Func<IReadOnlyList<string>, Task> save) => _save = save;

    public void Add(string cue)
    {
        // TODO 3
        throw new NotImplementedException();
    }

    /// Saves the cues, once. Make this `public async ValueTask DisposeAsync()`.
    public ValueTask DisposeAsync()
    {
        // TODO 4
        throw new NotImplementedException();
    }
}
