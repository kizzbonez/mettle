// Stage Lights
//
// A scene owns the spotlights it switches on and must switch them off, newest
// first, when it is disposed; the house lights it was handed are not its to
// switch off. A cue book saves its notes asynchronously when it is closed.

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
    private readonly List<Lamp> _spots = new();
    private bool _disposed;

    public Scene(Lamp houseLights, List<string> log)
    {
        HouseLights = houseLights;
        _log = log;
    }

    public Lamp HouseLights { get; }

    /// Switches on a new spotlight that belongs to this scene.
    public Lamp Spot(string name)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        var spot = new Lamp(name, _log);
        _spots.Add(spot);
        return spot;
    }

    /// Switches off every spotlight of this scene, newest first.
    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        // Like using declarations: the last one created is the first one released.
        for (int i = _spots.Count - 1; i >= 0; i--)
            _spots[i].Dispose();
        // HouseLights were handed to us; whoever created them disposes them.
    }
}

/// The stage manager's cues, saved when the book is closed.
public sealed class CueBook : IAsyncDisposable
{
    private readonly Func<IReadOnlyList<string>, Task> _save;
    private readonly List<string> _cues = new();
    private bool _disposed;

    public CueBook(Func<IReadOnlyList<string>, Task> save) => _save = save;

    public void Add(string cue)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        _cues.Add(cue);
    }

    /// Saves the cues, once.
    public async ValueTask DisposeAsync()
    {
        // Set the flag before the first await, so that a second call made while
        // the save is still running already sees it.
        if (_disposed) return;
        _disposed = true;
        await _save(_cues);
    }
}
