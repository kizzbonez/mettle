// Rebalancing Vans
//
// The night shift of a bike-share: vans move bikes between docking stations
// while riders keep renting and returning them. A move changes two stations at
// once, so it holds both stations' locks, always in the same order, and gives
// up after a short wait instead of hanging.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// <summary>A docking station. Riders rent and return bikes here at any moment. Leave it as it is.</summary>
public sealed class Station(int id, int bikes)
{
    private int _bikes = bikes;

    public int Id { get; } = id;

    /// <summary>
    /// The station's lock. It is internal rather than private because a move
    /// has to hold the locks of two stations at once.
    /// </summary>
    internal Lock Gate { get; } = new();

    public int Bikes
    {
        get { lock (Gate) return _bikes; }
    }

    /// <summary>A rider takes a bike, if one is docked.</summary>
    public bool TryRent()
    {
        lock (Gate)
        {
            if (_bikes == 0) return false;
            _bikes--;
            return true;
        }
    }

    /// <summary>A rider docks a bike.</summary>
    public void Return()
    {
        lock (Gate) _bikes++;
    }

    /// <summary>Adds bikes, or removes them with a negative change. The caller must hold <see cref="Gate"/>.</summary>
    internal void Adjust(int change)
    {
        if (!Gate.IsHeldByCurrentThread)
            throw new InvalidOperationException($"station {Id} was changed by a thread that does not hold its Gate");
        _bikes += change;
    }
}

/// <summary>Moves bikes between stations. Every van shares one, so it is safe to use from many threads.</summary>
public sealed class Rebalancer
{
    // TODO: two fields for the counters.

    /// <summary>The number of moves that succeeded.</summary>
    public long Moves => throw new NotImplementedException();

    /// <summary>The number of bikes those moves carried.</summary>
    public long BikesMoved => throw new NotImplementedException();

    /// <summary>
    /// Moves <paramref name="bikes"/> bikes from one station to another. Returns
    /// false, and changes nothing, if a station's lock is not free within
    /// <paramref name="wait"/> or <paramref name="from"/> has too few bikes.
    /// </summary>
    public bool TryMove(Station from, Station to, int bikes, TimeSpan wait)
    {
        // TODO: check the arguments, lock both stations (lower id first) with
        //       Gate.TryEnter(wait), move the bikes, release in finally, count.
        throw new NotImplementedException();
    }
}
