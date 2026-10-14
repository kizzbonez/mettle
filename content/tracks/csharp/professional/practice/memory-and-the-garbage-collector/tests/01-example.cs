// The example from the instructions. Nothing here looks at a clock: what is
// checked is how many bytes a call allocates on the managed heap.

// Calls `work` three times to warm it up, then returns the fewest bytes one
// call allocated, out of three more calls.
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

Ping[] pings = [new(101, Zone: 3, Kmh: 40), new(102, 7, 5), new(103, 3, 0), new(104, 3, 22)];
int count = 0;
int[] drivers = [];
object? sink = null;

long bytes = AllocatedBy(() => count = Surge.CountInZone(pings, 3));
Check.Equal(count, 3, "pings from zone 3");
Check.Equal(bytes, 0L, "bytes allocated by CountInZone");

bytes = AllocatedBy(() => drivers = Surge.DriversInZone(pings, 3));
Check.SequenceEqual(drivers, [101, 103, 104], "drivers in zone 3, in the order of the input");
long oneArray = AllocatedBy(() => sink = new int[3]);
Check.True(bytes <= oneArray,
    $"DriversInZone may allocate the bytes of its result, an int[3] of {oneArray} bytes, and it allocated {bytes}");

bytes = AllocatedBy(() => count = Surge.CountWhere(pings, new SlowerThan(10)));
Check.Equal(count, 2, "pings slower than 10 km/h");
Check.Equal(bytes, 0L, "bytes allocated by CountWhere with the struct rule SlowerThan");

bytes = AllocatedBy(() => count = Surge.CountWhere(pings, new InZone(7)));
Check.Equal(count, 1, "pings that the rule InZone(7) matches");
Check.Equal(bytes, 0L, "bytes allocated by CountWhere with the struct rule InZone");
