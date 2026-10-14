var ledger = new UsageLedger();
Check.Equal(ledger.TotalFor(5), 0m, "total for a meter with no readings");
Check.Equal(ledger.MeterCount, 0, "meters in an empty ledger");
Check.SequenceEqual(ledger.Totals(), [], "totals of an empty ledger");

Check.True(ledger.Add(new Reading(5, 100, 1.5m)), "a new reading is counted");
Check.True(ledger.Add(new Reading(5, 200, 1.5m)), "the same meter at a different time is a new reading");
Check.True(!ledger.Add(new Reading(5, 100, 9m)), "the same meter and time is a resend, even if the litres differ");
Check.True(ledger.Add(new Reading(6, 100, 4m)), "a different meter at the same time is a new reading");
Check.Equal(ledger.TotalFor(5), 3m, "total for meter 5 after a resend");

var snapshot = ledger.Totals();
ledger.Add(new Reading(1, 100, 1m));
Check.Equal(snapshot.Count, 2, "a list returned by Totals() does not change when readings are added later");
Check.SequenceEqual(ledger.Totals(), [(1, 1m), (5, 3m), (6, 4m)], "totals, ordered by meter id");

// Four importers add the same 2,500 readings at the same time; each reading counts once.
var shared = new UsageLedger();
Reading[] readings = Enumerable.Range(0, 2_500)
    .Select(i => new Reading(MeterId: 100 + i % 50, UnixSeconds: 1_760_000_000 + i, Litres: 0.25m * (i % 7)))
    .ToArray();
int[] counted = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => Task.Run(() =>
{
    int mine = 0;
    foreach (Reading r in readings)
        if (shared.Add(r)) mine++;
    return mine;
})));

Check.Equal(counted.Sum(), 2_500, "Add calls that returned true across all importers");
Check.Equal(shared.MeterCount, 50, "meters after the concurrent import");
var expected = readings.GroupBy(r => r.MeterId).Select(g => (g.Key, g.Sum(r => r.Litres))).OrderBy(t => t.Key);
Check.SequenceEqual(shared.Totals(), expected, "totals after the concurrent import");
