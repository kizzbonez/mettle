// Surge Zones
//
// Every second a ride-hailing service counts the drivers in each zone of a
// city. The versions in production are correct and allocate on every call;
// these do the same work with the hidden allocations removed: no LINQ and no
// closure in a hot loop, a result array of the right size from the start, and
// no boxing of a struct rule.

/// <summary>One position report from a driver's phone. A small readonly struct, so an array of them is one block.</summary>
public readonly record struct Ping(int DriverId, int Zone, int Kmh);

/// <summary>A test that a ping passes or fails.</summary>
public interface IPingRule
{
    bool Matches(Ping ping);
}

/// <summary>Drivers moving slower than a limit: stuck in traffic.</summary>
public readonly record struct SlowerThan(int Kmh) : IPingRule
{
    public bool Matches(Ping ping) => ping.Kmh < Kmh;
}

/// <summary>Drivers in one zone.</summary>
public readonly record struct InZone(int Zone) : IPingRule
{
    public bool Matches(Ping ping) => ping.Zone == Zone;
}

// ---- What production runs today: correct, and wasteful. ----

public static class Before
{
    /// <summary>The lambda captures <paramref name="zone"/>: a closure object, a delegate, and LINQ's own work.</summary>
    public static int CountInZone(Ping[] pings, int zone) => pings.Count(ping => ping.Zone == zone);

    /// <summary>A list that grows several times, and then a copy of it.</summary>
    public static int[] DriversInZone(Ping[] pings, int zone)
    {
        var drivers = new List<int>();
        foreach (Ping ping in pings)
            if (ping.Zone == zone) drivers.Add(ping.DriverId);
        return drivers.ToArray();
    }

    /// <summary>A struct rule passed as <see cref="IPingRule"/> is boxed at every call.</summary>
    public static int CountWhere(Ping[] pings, IPingRule rule)
    {
        int count = 0;
        foreach (Ping ping in pings)
            if (rule.Matches(ping)) count++;
        return count;
    }
}

// ---- The same work without the allocations. ----

public static class Surge
{
    /// <summary>How many pings come from <paramref name="zone"/>. Allocates nothing.</summary>
    public static int CountInZone(Ping[] pings, int zone)
    {
        int count = 0;
        foreach (Ping ping in pings)
            if (ping.Zone == zone) count++;
        return count;
    }

    /// <summary>The drivers of the pings from <paramref name="zone"/>, in input order. Allocates only the result.</summary>
    public static int[] DriversInZone(Ping[] pings, int zone)
    {
        // Count first, so the array has the right size and never grows.
        var drivers = new int[CountInZone(pings, zone)];
        int next = 0;
        foreach (Ping ping in pings)
            if (ping.Zone == zone) drivers[next++] = ping.DriverId;
        return drivers;
    }

    /// <summary>How many pings match the rule. Generic, so a struct rule is never boxed.</summary>
    public static int CountWhere<TRule>(Ping[] pings, TRule rule) where TRule : IPingRule
    {
        int count = 0;
        foreach (Ping ping in pings)
            if (rule.Matches(ping)) count++;
        return count;
    }
}
