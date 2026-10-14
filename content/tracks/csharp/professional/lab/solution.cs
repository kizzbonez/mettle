// Meter Reading Relay: reference solution.

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

public static class MeterLine
{
    /// <summary>Parses "M-00412,1760421600,1532.75" without allocating.</summary>
    public static bool TryParse(ReadOnlySpan<char> line, out Reading reading)
    {
        reading = default;
        line = line.Trim();

        int first = line.IndexOf(',');
        if (first < 0) return false;
        ReadOnlySpan<char> meter = line[..first];
        ReadOnlySpan<char> rest = line[(first + 1)..];

        int second = rest.IndexOf(',');
        if (second < 0) return false;
        ReadOnlySpan<char> time = rest[..second];
        ReadOnlySpan<char> litres = rest[(second + 1)..];
        if (litres.Contains(',')) return false;

        if (meter.Length is < 3 or > 11 || !meter.StartsWith("M-")) return false;
        if (!int.TryParse(meter[2..], NumberStyles.None, CultureInfo.InvariantCulture, out int meterId)) return false;
        if (!long.TryParse(time, NumberStyles.None, CultureInfo.InvariantCulture, out long seconds)) return false;
        if (!decimal.TryParse(litres, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out decimal amount)) return false;

        reading = new Reading(meterId, seconds, amount);
        return true;
    }
}

public sealed class UsageLedger
{
    private readonly ConcurrentDictionary<(int MeterId, long UnixSeconds), byte> _seen = new();
    private readonly ConcurrentDictionary<int, decimal> _totals = new();

    /// <summary>Adds a reading once; a resent reading returns false and changes nothing.</summary>
    public bool Add(Reading reading)
    {
        if (!_seen.TryAdd((reading.MeterId, reading.UnixSeconds), 0)) return false;
        _totals.AddOrUpdate(reading.MeterId, reading.Litres, (_, total) => total + reading.Litres);
        return true;
    }

    public decimal TotalFor(int meterId) => _totals.TryGetValue(meterId, out decimal total) ? total : 0m;

    public int MeterCount => _totals.Count;

    public IReadOnlyList<(int MeterId, decimal Litres)> Totals() =>
        _totals.Select(pair => (pair.Key, pair.Value)).OrderBy(pair => pair.Key).ToList();
}

public sealed class MeterRelay
{
    private readonly IBillingGateway _gateway;
    private readonly RelaySettings _settings;

    public MeterRelay(IBillingGateway gateway, RelaySettings settings)
    {
        ArgumentNullException.ThrowIfNull(gateway);
        ArgumentNullException.ThrowIfNull(settings);
        ArgumentOutOfRangeException.ThrowIfLessThan(settings.MaxConcurrency, 1);
        ArgumentOutOfRangeException.ThrowIfLessThan(settings.MaxAttempts, 1);
        _gateway = gateway;
        _settings = settings;
    }

    public async Task<RelayReport> RelayAsync(IEnumerable<MeterBatch> batches, CancellationToken cancellationToken = default)
    {
        int delivered = 0;
        int attempts = 0;
        var failed = new ConcurrentBag<string>();
        var options = new ParallelOptions
        {
            MaxDegreeOfParallelism = _settings.MaxConcurrency,
            CancellationToken = cancellationToken,
        };

        await Parallel.ForEachAsync(batches, options, async (batch, ct) =>
        {
            for (int attempt = 1; ; attempt++)
            {
                Interlocked.Increment(ref attempts);
                try
                {
                    await _gateway.SendAsync(batch, ct);
                    Interlocked.Increment(ref delivered);
                    return;
                }
                catch (TransientGatewayException) when (attempt < _settings.MaxAttempts)
                {
                    // Worth another try.
                }
                catch (Exception error) when (error is not OperationCanceledException || !ct.IsCancellationRequested)
                {
                    failed.Add(batch.Id);
                    return;
                }
            }
        });

        return new RelayReport(delivered, failed.Order(StringComparer.Ordinal).ToList(), attempts);
    }
}
