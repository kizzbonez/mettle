// Meter Reading Relay
//
// Every `throw new NotImplementedException();` marks code you write.
// The types above the line "Your code starts here" are given: keep their
// names and signatures, because the tests use them.

using System.Collections.Concurrent;
using System.Globalization;

/// <summary>One reading from one water meter.</summary>
public readonly record struct Reading(int MeterId, long UnixSeconds, decimal Litres);

/// <summary>A batch of readings for the billing gateway.</summary>
public sealed record MeterBatch(string Id, IReadOnlyList<Reading> Readings);

/// <summary>The billing system's intake API.</summary>
public interface IBillingGateway
{
    Task SendAsync(MeterBatch batch, CancellationToken cancellationToken);
}

/// <summary>Thrown by the gateway for failures that are worth retrying.</summary>
public sealed class TransientGatewayException(string message) : Exception(message);

/// <summary>Adapts a lambda to <see cref="IBillingGateway"/>. The tests use it; keep it.</summary>
public sealed class DelegateGateway(Func<MeterBatch, CancellationToken, Task> send) : IBillingGateway
{
    public Task SendAsync(MeterBatch batch, CancellationToken cancellationToken) => send(batch, cancellationToken);
}

public sealed record RelaySettings(int MaxConcurrency, int MaxAttempts);

public sealed record RelayReport(int Delivered, IReadOnlyList<string> FailedBatchIds, int Attempts);

// ---------------------------------------------------------------- Your code starts here

public static class MeterLine
{
    /// <summary>
    /// Parses one line such as "M-00412,1760421600,1532.75".
    /// Returns false, with <paramref name="reading"/> set to default, for a malformed line.
    /// Must not allocate on the managed heap.
    /// </summary>
    public static bool TryParse(ReadOnlySpan<char> line, out Reading reading)
    {
        throw new NotImplementedException();
    }
}

/// <summary>Per-meter totals. Safe to use from many threads at once.</summary>
public sealed class UsageLedger
{
    // TODO: choose the fields that hold what has been seen and the totals.

    /// <summary>Adds a reading once. A resend (same meter, same time) returns false and changes nothing.</summary>
    public bool Add(Reading reading)
    {
        throw new NotImplementedException();
    }

    /// <summary>Total litres for one meter, or 0 if the meter has no readings.</summary>
    public decimal TotalFor(int meterId)
    {
        throw new NotImplementedException();
    }

    /// <summary>The number of meters that have at least one reading.</summary>
    public int MeterCount => throw new NotImplementedException();

    /// <summary>A snapshot of every meter's total, ordered by meter id.</summary>
    public IReadOnlyList<(int MeterId, decimal Litres)> Totals()
    {
        throw new NotImplementedException();
    }
}

/// <summary>Sends batches to the billing gateway with bounded concurrency and retries.</summary>
public sealed class MeterRelay
{
    public MeterRelay(IBillingGateway gateway, RelaySettings settings)
    {
        throw new NotImplementedException();
    }

    public Task<RelayReport> RelayAsync(IEnumerable<MeterBatch> batches, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }
}
