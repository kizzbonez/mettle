// Giving up cleanly: a move that returns false holds no lock afterwards and
// changes nothing. Every move runs on another thread, so a lock it forgot to
// release shows up as busy here.

static ManualResetEventSlim Hold(Station station, ManualResetEventSlim release)
{
    var held = new ManualResetEventSlim();
    var rider = new Thread(() =>
    {
        station.Gate.Enter();
        held.Set();
        release.Wait();
        station.Gate.Exit();
    }) { IsBackground = true };
    rider.Start();
    return held;
}

// True if some thread holds the station's Gate at this moment. It asks from a
// brand-new thread: after an await this test may run on the very pool thread
// that took the lock, and a Lock lets its owner enter again.
static bool HeldElsewhere(Station station)
{
    bool busy = false;
    var probe = new Thread(() =>
    {
        if (station.Gate.TryEnter()) station.Gate.Exit();
        else busy = true;
    });
    probe.Start();
    probe.Join();
    return busy;
}

static async Task<bool> Move(Rebalancer vans, Station from, Station to, int bikes, TimeSpan wait)
{
    Task<bool> move = Task.Run(() => vans.TryMove(from, to, bikes, wait));
    Check.True(await Task.WhenAny(move, Task.Delay(TimeSpan.FromSeconds(3))) == move,
        "TryMove returns after its wait instead of waiting forever for a busy station");
    return await move;
}

var low = new Station(1, 10);
var high = new Station(2, 10);
var vans = new Rebalancer();
var brief = TimeSpan.FromMilliseconds(50);

// The station with the higher id is busy.
var releaseHigh = new ManualResetEventSlim();
Check.True(Hold(high, releaseHigh).Wait(TimeSpan.FromSeconds(3)), "the test's rider holds a station's Gate");
Check.True(!await Move(vans, low, high, 3, brief), "a move gives up when the second station it needs is busy");
Check.True(!HeldElsewhere(low), "after giving up on the second station, the move has released the first one");
Check.True(!await Move(vans, high, low, 3, brief), "a move in the other direction gives up on the busy station too");
Check.True(!HeldElsewhere(low), "after giving up in the other direction, the move has released the first station");
releaseHigh.Set();
Check.Equal((low.Bikes, high.Bikes), (10, 10), "bikes at both stations after two moves that gave up");

// The station with the lower id is busy.
var releaseLow = new ManualResetEventSlim();
Check.True(Hold(low, releaseLow).Wait(TimeSpan.FromSeconds(3)), "the test's rider holds a station's Gate");
Check.True(!await Move(vans, high, low, 3, brief), "a move gives up when the first station it needs is busy");
Check.True(!HeldElsewhere(high), "a move that could not lock its first station holds no lock afterwards");
releaseLow.Set();
Check.Equal((low.Bikes, high.Bikes), (10, 10), "bikes at both stations after a move that could not lock its first station");

// Too few bikes.
var second = TimeSpan.FromSeconds(1);
Check.True(!await Move(vans, low, high, 11, second), "a move of more bikes than the station has");
Check.True(!HeldElsewhere(low) && !HeldElsewhere(high), "a move refused for lack of bikes releases both stations");
Check.Equal((low.Bikes, high.Bikes), (10, 10), "bikes at both stations after a move refused for lack of bikes");
Check.Equal((vans.Moves, vans.BikesMoved), (0L, 0L), "moves that returned false are not counted");

Check.True(await Move(vans, low, high, 10, second), "a move of every bike a station has");
Check.True(!HeldElsewhere(low) && !HeldElsewhere(high), "a move that worked releases both stations");
Check.Equal((low.Bikes, high.Bikes), (0, 20), "bikes at both stations after moving all ten");
Check.True(!await Move(vans, low, high, 1, second), "a move from a station that is empty");
Check.Equal((vans.Moves, vans.BikesMoved), (1L, 10L), "only the move that returned true is counted");

// Invalid moves throw before taking any lock.
await Task.Run(() =>
{
    Check.Throws<ArgumentOutOfRangeException>(() => vans.TryMove(high, low, 0, second), "a move of zero bikes");
    Check.Throws<ArgumentOutOfRangeException>(() => vans.TryMove(high, low, -3, second), "a move of a negative number of bikes");
    Check.Throws<ArgumentException>(() => vans.TryMove(high, high, 1, second), "a move from a station to itself");
    Check.Throws<ArgumentException>(() => vans.TryMove(high, new Station(2, 5), 1, second), "a move between two stations with the same id");
});
Check.True(!HeldElsewhere(low) && !HeldElsewhere(high), "an invalid move holds no lock afterwards");
Check.Equal((low.Bikes, high.Bikes), (0, 20), "invalid moves change no station");
Check.Equal((vans.Moves, vans.BikesMoved), (1L, 10L), "invalid moves are not counted");
