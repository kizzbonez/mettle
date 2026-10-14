// The example from the instructions. Moves run on other threads, as they do in
// the dispatch service, and a thread of the test plays the rider.

// Holds a station's Gate on a thread of its own until `release` is set.
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

// Runs one move on another thread and waits a few seconds at most for it.
static async Task<bool> Move(Rebalancer vans, Station from, Station to, int bikes, TimeSpan wait)
{
    Task<bool> move = Task.Run(() => vans.TryMove(from, to, bikes, wait));
    Check.True(await Task.WhenAny(move, Task.Delay(TimeSpan.FromSeconds(3))) == move,
        "TryMove returns after its wait instead of waiting forever for a busy station");
    return await move;
}

var depot = new Station(1, bikes: 10);
var park = new Station(2, bikes: 0);
var vans = new Rebalancer();

Check.True(await Move(vans, depot, park, 4, TimeSpan.FromSeconds(1)), "moving 4 of the depot's 10 bikes to the park");
Check.Equal((depot.Bikes, park.Bikes), (6, 4), "bikes at the depot and at the park after the first move");
Check.True(!await Move(vans, park, depot, 5, TimeSpan.FromSeconds(1)), "moving 5 bikes from a park that has 4");
Check.Equal((vans.Moves, vans.BikesMoved), (1L, 4L), "Moves and BikesMoved after one move that worked and one that did not");

// A rider is in the middle of a rental at the park.
var release = new ManualResetEventSlim();
Check.True(Hold(park, release).Wait(TimeSpan.FromSeconds(3)), "the test's rider holds the park's Gate");
Check.True(!await Move(vans, depot, park, 1, TimeSpan.FromMilliseconds(50)),
    "a move to a station whose Gate a rider holds gives up after the wait");
Check.True(!HeldElsewhere(depot), "the move that gave up has released the depot's Gate");
release.Set();
Check.Equal((depot.Bikes, park.Bikes), (6, 4), "bikes at the depot and at the park after the move that gave up");
Check.Equal((vans.Moves, vans.BikesMoved), (1L, 4L), "Moves and BikesMoved after the move that gave up");
