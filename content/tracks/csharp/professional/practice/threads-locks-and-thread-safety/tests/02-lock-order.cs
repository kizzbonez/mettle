// Lock order. A rider holds the station with the higher id. A move that follows
// the order has already locked the station with the lower id while it waits,
// whichever way its bikes go. The test looks, and then lets the rider go.

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

// Starts a move while the higher station is busy and reports whether the move
// held the lower station while it waited.
static async Task<bool> LowerLockedWhileWaiting(Station from, Station to)
{
    Station lower = from.Id < to.Id ? from : to;
    Station higher = from.Id < to.Id ? to : from;
    var release = new ManualResetEventSlim();
    Check.True(Hold(higher, release).Wait(TimeSpan.FromSeconds(3)), "the test's rider holds a station's Gate");

    var vans = new Rebalancer();
    Task<bool> move = Task.Run(() => vans.TryMove(from, to, 1, TimeSpan.FromSeconds(3)));
    bool sawLowerHeld = false;
    var watch = System.Diagnostics.Stopwatch.StartNew();
    while (!move.IsCompleted && watch.Elapsed < TimeSpan.FromSeconds(1))
    {
        if (HeldElsewhere(lower))
        {
            sawLowerHeld = true;
            break;
        }
        Thread.Sleep(1);
    }

    release.Set();
    Check.True(await Task.WhenAny(move, Task.Delay(TimeSpan.FromSeconds(4))) == move,
        "a move that waited for a busy station finishes once the station is free");
    Check.True(await move, "a move that waited for a busy station goes ahead once the station is free");
    return sawLowerHeld;
}

Check.True(await LowerLockedWhileWaiting(from: new Station(2, 5), to: new Station(1, 5)),
    "a move towards the station with the lower id locks the lower id first");
Check.True(await LowerLockedWhileWaiting(from: new Station(1, 5), to: new Station(2, 5)),
    "a move towards the station with the higher id locks the lower id first");

var nine = new Station(9, 5);
var three = new Station(3, 5);
Check.True(await LowerLockedWhileWaiting(nine, three),
    "the order follows the ids, not the order in which the stations were created");
Check.True(await LowerLockedWhileWaiting(three, nine),
    "the order follows the ids, not the order in which the stations are passed");

// Two vans on opposite routes between the same two stations, at the same time.
var north = new Station(10, 1000);
var south = new Station(20, 1000);
var shared = new Rebalancer();
Task<int> RunVan(Station from, Station to) => Task.Run(() =>
{
    int moved = 0;
    for (int i = 0; i < 300; i++)
        if (shared.TryMove(from, to, 1, TimeSpan.FromSeconds(2))) moved++;
    return moved;
});
Task<int[]> opposite = Task.WhenAll(RunVan(north, south), RunVan(south, north));
Check.True(await Task.WhenAny(opposite, Task.Delay(TimeSpan.FromSeconds(4))) == opposite,
    "two vans on opposite routes finish their moves");
Check.SequenceEqual(await opposite, [300, 300], "moves that worked for each of two vans on opposite routes");
Check.Equal(north.Bikes + south.Bikes, 2000, "bikes at both stations together after the two vans");
Check.Equal(shared.Moves, 600L, "Moves after two vans made 300 moves each");
