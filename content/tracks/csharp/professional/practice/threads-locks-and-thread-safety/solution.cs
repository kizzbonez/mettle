// Rebalancing Vans
//
// The night shift of a bike-share: vans move bikes between docking stations
// while riders keep renting and returning them. A move changes two stations at
// once, so it holds both stations' locks, always in the same order, and gives
// up after a short wait instead of hanging.

/// <summary>A docking station. Riders rent and return bikes here at any moment.</summary>
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
    private long _moves;
    private long _bikesMoved;

    /// <summary>The number of moves that succeeded.</summary>
    public long Moves => Interlocked.Read(ref _moves);

    /// <summary>The number of bikes those moves carried.</summary>
    public long BikesMoved => Interlocked.Read(ref _bikesMoved);

    /// <summary>
    /// Moves <paramref name="bikes"/> bikes from one station to another. Returns
    /// false, and changes nothing, if a station's lock is not free within
    /// <paramref name="wait"/> or <paramref name="from"/> has too few bikes.
    /// </summary>
    public bool TryMove(Station from, Station to, int bikes, TimeSpan wait)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(bikes, 1);
        if (from.Id == to.Id)
            throw new ArgumentException("a move needs two different stations", nameof(to));

        // One order for every move, whichever way the bikes go: the lower id first.
        (Station first, Station second) = from.Id < to.Id ? (from, to) : (to, from);

        if (!first.Gate.TryEnter(wait)) return false;
        try
        {
            if (!second.Gate.TryEnter(wait)) return false;
            try
            {
                if (from.Bikes < bikes) return false;
                from.Adjust(-bikes);
                to.Adjust(bikes);
            }
            finally
            {
                second.Gate.Exit();
            }
        }
        finally
        {
            first.Gate.Exit();
        }

        // Two lone counters: Interlocked is enough, no lock needed.
        Interlocked.Increment(ref _moves);
        Interlocked.Add(ref _bikesMoved, bikes);
        return true;
    }
}
