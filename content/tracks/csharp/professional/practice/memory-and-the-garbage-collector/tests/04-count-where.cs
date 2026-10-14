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

Ping[] city = Enumerable.Range(0, 40_000).Select(i => new Ping(i, i * 7919 % 25, i * 31 % 90)).ToArray();
int count = 0;

// Results first.
foreach (int limit in new[] { 0, 1, 10, 45, 89, 90, 500 })
    Check.Equal(Surge.CountWhere(city, new SlowerThan(limit)), Before.CountWhere(city, new SlowerThan(limit)),
        "pings slower than a limit, compared with the version in production");
foreach (int zone in new[] { 0, 7, 24, 99 })
    Check.Equal(Surge.CountWhere(city, new InZone(zone)), Before.CountWhere(city, new InZone(zone)),
        "pings that an InZone rule matches, compared with the version in production");
Check.Equal(Surge.CountWhere([], new SlowerThan(10)), 0, "pings matched when there are no pings");
Check.Equal(Surge.CountWhere([new Ping(1, 0, 9), new Ping(2, 0, 10)], new SlowerThan(10)), 1,
    "a ping at exactly the limit is not slower than it");

// The cost: neither the call nor the loop may box the rule.
long bytes = AllocatedBy(() => count = Surge.CountWhere(city, new SlowerThan(15)));
Check.Equal(count, Before.CountWhere(city, new SlowerThan(15)), "pings slower than 15 km/h in the city");
Check.Equal(bytes, 0L, "bytes allocated by CountWhere over 40,000 pings with the struct rule SlowerThan");

bytes = AllocatedBy(() => count = Surge.CountWhere(city, new InZone(3)));
Check.Equal(count, Before.CountInZone(city, 3), "pings that InZone(3) matches in the city");
Check.Equal(bytes, 0L, "bytes allocated by CountWhere over 40,000 pings with the struct rule InZone");

Ping[] one = [new Ping(1, 0, 0)];
bytes = AllocatedBy(() => count = Surge.CountWhere(one, new SlowerThan(5)));
Check.Equal(count, 1, "a single ping slower than the limit");
Check.Equal(bytes, 0L, "bytes allocated by CountWhere for a single ping, where boxing the rule would be most of the cost");
