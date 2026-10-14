// The example from the instructions, step by step.
Check.True(MeterLine.TryParse("M-00412,1760421600,1532.75", out Reading reading), "a well-formed line parses");
Check.Equal(reading, new Reading(412, 1760421600, 1532.75m), "the reading parsed from the example line");
Check.True(!MeterLine.TryParse("M-00412;1760421600;1532.75", out _), "a line with semicolons instead of commas is rejected");

var ledger = new UsageLedger();
Check.True(ledger.Add(reading), "the first copy of a reading is counted");
Check.True(!ledger.Add(reading), "a resent copy of the same reading is ignored");
ledger.Add(new Reading(412, 1760425200, 10m));
ledger.Add(new Reading(7, 1760421600, 2.5m));
Check.Equal(ledger.TotalFor(412), 1542.75m, "total for meter 412");
Check.Equal(ledger.MeterCount, 2, "number of meters in the ledger");
Check.SequenceEqual(ledger.Totals(), [(7, 2.5m), (412, 1542.75m)], "totals, ordered by meter id");

int nightTwoFailures = 0;
var gateway = new DelegateGateway((batch, ct) =>
{
    if (batch.Id == "night-2" && Interlocked.Increment(ref nightTwoFailures) == 1)
        throw new TransientGatewayException("gateway busy");
    return Task.CompletedTask;
});
var relay = new MeterRelay(gateway, new RelaySettings(MaxConcurrency: 2, MaxAttempts: 3));
MeterBatch[] batches = [new("night-1", [reading]), new("night-2", []), new("night-3", [])];

RelayReport report = await relay.RelayAsync(batches);

Check.Equal(report.Delivered, 3, "batches delivered");
Check.SequenceEqual(report.FailedBatchIds, [], "failed batch ids");
Check.Equal(report.Attempts, 4, "calls made to the gateway, retries included");
