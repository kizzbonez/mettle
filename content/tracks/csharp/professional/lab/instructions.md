Write `solution.cs` using the base class library only. The starter declares every type the tests
use. Keep the types above the line "Your code starts here" exactly as they are, and replace each
`throw new NotImplementedException();` below it. Add any private fields and `using` lines you need.

### 1. `MeterLine.TryParse(ReadOnlySpan<char> line, out Reading reading)`

A line looks like `M-00412,1760421600,1532.75`: meter, Unix time in seconds, litres.

1. Ignore whitespace at the start and end of the whole line (Windows meters end lines with `\r`).
2. There must be exactly three fields, separated by commas.
3. The meter field is `M-` (capital M) followed by 1 to 9 ASCII digits. `MeterId` is that number,
   so `M-00412` is meter 412.
4. The time field is one or more ASCII digits and nothing else: no sign, no spaces.
5. The litres field is digits with an optional decimal point and fraction, read with the
   invariant culture: no sign, no exponent, no units.
6. Return `true` and the reading for a valid line. Otherwise return `false` and set `reading` to
   `default`.
7. **Do not allocate.** Parsing a valid or a malformed line must not allocate anything on the
   managed heap. A test measures this with `GC.GetAllocatedBytesForCurrentThread()`.

### 2. `UsageLedger`

1. `Add(reading)` records a reading and returns `true`. A reading with the same `MeterId` and
   `UnixSeconds` as one already recorded is a resend: return `false` and change nothing, even if
   its litres differ.
2. `TotalFor(meterId)` returns the meter's total litres, or `0` for a meter with no readings.
3. `MeterCount` is the number of meters with at least one reading.
4. `Totals()` returns a snapshot of `(MeterId, Litres)` pairs ordered by meter id. A list you
   returned earlier must not change when more readings are added.
5. Several importer threads call `Add` at the same time. Every member must be safe under
   concurrent use, and every reading must be counted exactly once.

### 3. `MeterRelay`

1. The constructor takes the gateway and the settings. Throw `ArgumentOutOfRangeException` if
   `MaxConcurrency` or `MaxAttempts` is less than 1.
2. `RelayAsync(batches, cancellationToken)` sends every batch with
   `gateway.SendAsync(batch, token)`.
3. **At most `MaxConcurrency` calls to `SendAsync` may be in progress at any moment.** With 8
   batches and a limit of 3, three calls run at once while the other batches wait their turn.
4. If `SendAsync` throws `TransientGatewayException`, call it again for the same batch, up to
   `MaxAttempts` calls in total for that batch. Any other exception fails the batch at once, with
   no retry.
5. A failed batch never stops the others, and `RelayAsync` does not throw because of gateway
   errors. It returns a `RelayReport`:
   - `Delivered`: batches whose `SendAsync` completed successfully;
   - `FailedBatchIds`: the ids of the failed batches, sorted with ordinal string order;
   - `Attempts`: the total number of `SendAsync` calls, retries included.
6. If the token is cancelled, `RelayAsync` throws `OperationCanceledException`. With a token
   that is already cancelled, it must not call the gateway at all.

### Example

```csharp
MeterLine.TryParse("M-00412,1760421600,1532.75", out Reading r);   // true: Reading(412, 1760421600, 1532.75)
MeterLine.TryParse("M-00412;1760421600;1532.75", out _);           // false

var ledger = new UsageLedger();
ledger.Add(r);                                  // true
ledger.Add(r);                                  // false: a resend
ledger.Add(new Reading(412, 1760425200, 10m));
ledger.Add(new Reading(7, 1760421600, 2.5m));
ledger.TotalFor(412);                           // 1542.75
ledger.Totals();                                // [(7, 2.5), (412, 1542.75)]

// "night-2" fails with TransientGatewayException on its first call only.
var relay = new MeterRelay(gateway, new RelaySettings(MaxConcurrency: 2, MaxAttempts: 3));
RelayReport report = await relay.RelayAsync([new("night-1", [r]), new("night-2", []), new("night-3", [])]);
// report: Delivered 3, FailedBatchIds [], Attempts 4
```

### Tips

- Spans: `Trim`, `IndexOf`, slicing with ranges, and the `TryParse` overloads of `int`, `long`
  and `decimal` that take a `ReadOnlySpan<char>`, a `NumberStyles` and
  `CultureInfo.InvariantCulture`. `NumberStyles.None` accepts digits only.
- `ConcurrentDictionary` has an atomic `TryAdd` and `AddOrUpdate`. A `Lock` around ordinary
  collections is just as correct; keep the locked sections short.
- `Parallel.ForEachAsync` with `MaxDegreeOfParallelism` throttles for you. If you use
  `SemaphoreSlim` instead, release it in a `finally` block.
- Counters updated from several deliveries at once need `Interlocked` or a lock.
