// Surge Zones
//
// Every second a ride-hailing service counts the drivers in each zone of a
// city. The versions in production are correct and allocate on every call.
// You write the same work with the hidden allocations removed.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

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

// ---- What production runs today: correct, and wasteful. Leave these as they
// ---- are, and use them to compare results.

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

// ---- Yours to write: the same work without the allocations.

public static class Surge
{
    /// <summary>How many pings come from <paramref name="zone"/>. Allocates nothing.</summary>
    public static int CountInZone(Ping[] pings, int zone)
    {
        throw new NotImplementedException();
    }

    /// <summary>The drivers of the pings from <paramref name="zone"/>, in input order. Allocates only the result.</summary>
    public static int[] DriversInZone(Ping[] pings, int zone)
    {
        throw new NotImplementedException();
    }

    /// <summary>How many pings match the rule. Allocates nothing, even for a struct rule.</summary>
    public static int CountWhere(Ping[] pings, IPingRule rule)
    {
        // TODO: this signature boxes a struct rule before the method even
        //       starts. Change it as the instructions say, then write the body.
        throw new NotImplementedException();
    }
}
