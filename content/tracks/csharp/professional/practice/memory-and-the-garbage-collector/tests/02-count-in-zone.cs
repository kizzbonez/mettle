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

// Forty thousand drivers spread over 25 zones.
Ping[] city = Enumerable.Range(0, 40_000).Select(i => new Ping(i, i * 7919 % 25, i * 31 % 90)).ToArray();

// Results first: a cheap wrong answer is still wrong.
for (int zone = 0; zone < 25; zone++)
    Check.Equal(Surge.CountInZone(city, zone), Before.CountInZone(city, zone),
        "pings counted in a zone, compared with the version in production");
Check.Equal(Surge.CountInZone(city, 99), 0, "pings in a zone nobody is in");
Check.Equal(Surge.CountInZone([], 3), 0, "pings in a zone when there are no pings");
Check.Equal(Surge.CountInZone([new Ping(1, 3, 10)], 3), 1, "a single ping in the zone asked for");
Check.Equal(Surge.CountInZone([new Ping(1, -2, 10), new Ping(2, 2, 10)], -2), 1, "a zone with a negative number is a zone like any other");

// The cost.
int count = 0;
long bytes = AllocatedBy(() => count = Surge.CountInZone(city, 12));
Check.Equal(count, Before.CountInZone(city, 12), "pings counted in zone 12 of the city");
Check.Equal(bytes, 0L, "bytes allocated by CountInZone over 40,000 pings");

bytes = AllocatedBy(() => count = Surge.CountInZone(city, 99));
Check.Equal(bytes, 0L, "bytes allocated by CountInZone for a zone nobody is in");

for (int zone = 0; zone < 25; zone += 6)
{
    int z = zone;
    Check.Equal(AllocatedBy(() => count = Surge.CountInZone(city, z)), 0L, "bytes allocated by CountInZone, whichever zone is asked for");
}
