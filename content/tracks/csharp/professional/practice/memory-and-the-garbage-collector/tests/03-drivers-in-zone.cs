static long AllocatedBy(Action work)
{
    for (int i = 0; i < 3; i++) work();
    long fewest = long.MaxValue;
    for (int i = 0; i < 3; i++)
    {
        long before = GC.GetAllocatedBytesForCurrentThread();
        work();
        fewest = Math.Min(fewest, GC.GetAllocatedBytesForCurrentThread() - before);
    }
    return fewest;
}

Ping[] city = Enumerable.Range(0, 40_000).Select(i => new Ping(1_000_000 + i, i * 7919 % 25, i * 31 % 90)).ToArray();
int[] drivers = [];
object? sink = null;

// Results first.
for (int zone = 0; zone < 25; zone += 4)
    Check.SequenceEqual(Surge.DriversInZone(city, zone), Before.DriversInZone(city, zone),
        "drivers in a zone, in input order, compared with the version in production");
Check.SequenceEqual(Surge.DriversInZone(city, 99), [], "drivers in a zone nobody is in");
Check.SequenceEqual(Surge.DriversInZone([], 0), [], "drivers when there are no pings");
Check.SequenceEqual(Surge.DriversInZone([new Ping(7, 0, 0), new Ping(8, 0, 0), new Ping(9, 0, 0)], 0), [7, 8, 9],
    "drivers when every ping is in the zone asked for");
Check.SequenceEqual(Surge.DriversInZone([new Ping(5, 1, 0), new Ping(5, 1, 30)], 1), [5, 5],
    "a driver who sent two pings from the zone appears twice");

// The cost: the bytes of the result array, and nothing else.
foreach (int zone in new[] { 0, 11, 24 })
{
    int expected = Before.CountInZone(city, zone);
    long bytes = AllocatedBy(() => drivers = Surge.DriversInZone(city, zone));
    long result = AllocatedBy(() => sink = new int[expected]);
    Check.Equal(drivers.Length, expected, "the length of the array DriversInZone returns");
    Check.True(bytes <= result,
        $"DriversInZone over 40,000 pings may allocate the bytes of its result, {result}, and it allocated {bytes}");
}

long none = AllocatedBy(() => drivers = Surge.DriversInZone(city, 99));
long emptyArray = AllocatedBy(() => sink = new int[0]);
Check.True(none <= emptyArray,
    $"DriversInZone for a zone nobody is in may allocate an empty array, {emptyArray} bytes, and it allocated {none}");

// A zone that holds every ping.
Ping[] stadium = Enumerable.Range(0, 5_000).Select(i => new Ping(i, 4, 0)).ToArray();
long all = AllocatedBy(() => drivers = Surge.DriversInZone(stadium, 4));
long allArray = AllocatedBy(() => sink = new int[5_000]);
Check.SequenceEqual(drivers, Enumerable.Range(0, 5_000), "drivers when all 5,000 pings are in the zone");
Check.True(all <= allArray,
    $"DriversInZone with 5,000 matches may allocate the bytes of its result, {allArray}, and it allocated {all}");
