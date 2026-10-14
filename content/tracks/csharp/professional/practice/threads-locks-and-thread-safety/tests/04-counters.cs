// Four vans share one Rebalancer and move bikes around a ring of four stations,
// while riders rent and return bikes at the same stations. Everything is joined
// before anything is checked.
var vans = new Rebalancer();
Check.Equal((vans.Moves, vans.BikesMoved), (0L, 0L), "Moves and BikesMoved of a new Rebalancer");

Station[] ring = [new(1, 5000), new(2, 5000), new(3, 5000), new(4, 5000)];
long expectedBikes = 0;
for (int van = 0; van < 4; van++)
    for (int i = 0; i < 250; i++)
        expectedBikes += 1 + (van + i) % 3;

Task<int>[] runs = Enumerable.Range(0, 4).Select(van => Task.Run(() =>
{
    int worked = 0;
    for (int i = 0; i < 250; i++)
    {
        Station from = ring[(van + i) % 4];
        Station to = ring[(van + i + 1 + i % 2) % 4];
        if (vans.TryMove(from, to, 1 + (van + i) % 3, TimeSpan.FromSeconds(2))) worked++;
    }
    return worked;
})).ToArray();
Task riders = Task.Run(() =>
{
    for (int i = 0; i < 4000; i++)
    {
        Station station = ring[i % 4];
        if (station.TryRent()) station.Return();
    }
});

Task[] everything = [.. runs, riders];
Task all = Task.WhenAll(everything);
Check.True(await Task.WhenAny(all, Task.Delay(TimeSpan.FromSeconds(4))) == all,
    "four vans and the riders finish their work");

int succeeded = runs.Sum(run => run.Result);
Check.Equal(succeeded, 1000, "moves that returned true, out of 1,000 moves between stations that all had enough bikes");
Check.Equal(vans.Moves, 1000L, "Moves after four vans shared one Rebalancer");
Check.Equal(vans.BikesMoved, expectedBikes, "BikesMoved after four vans shared one Rebalancer");
Check.Equal(ring.Sum(station => station.Bikes), 20000, "bikes in the whole ring after the night shift");

// Afterwards, one more move that fails and one that works.
Check.True(!vans.TryMove(ring[0], ring[1], ring[0].Bikes + 1, TimeSpan.FromSeconds(1)), "a move of more bikes than the station has");
Check.Equal(vans.Moves, 1000L, "a move that returned false leaves Moves as it was");
Check.True(vans.TryMove(ring[3], ring[2], 2, TimeSpan.FromSeconds(1)), "a move after the night shift");
Check.Equal((vans.Moves, vans.BikesMoved), (1001L, expectedBikes + 2), "Moves and BikesMoved after one more move of 2 bikes");
