// Road Trip
//
// A classic extension method on string, an extension property and a static
// extension member on TimeSpan, and an extension block for every sequence of
// legs.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// <summary>One leg of the trip. Complete: do not change it.</summary>
public record Leg(string From, string To, double Km, TimeSpan Time);

public static class TripExtensions
{
    /// <summary>The first three characters of the trimmed place name, in capitals.</summary>
    public static string Code(this string place)
    {
        throw new NotImplementedException();
    }

    extension(TimeSpan time)
    {
        /// <summary>Whole hours and two-digit minutes, such as 2h05.</summary>
        public string Clock => throw new NotImplementedException();
    }

    extension(TimeSpan)
    {
        /// <summary>The time to drive km at kmPerHour, to the nearest minute.</summary>
        public static TimeSpan Driving(double km, double kmPerHour)
        {
            throw new NotImplementedException();
        }
    }

    extension(IEnumerable<Leg> legs)
    {
        /// <summary>The kilometres of all the legs added up.</summary>
        public double TotalKm => throw new NotImplementedException();

        /// <summary>The place codes of the route, such as LIS > POR > MAD.</summary>
        public string Route()
        {
            throw new NotImplementedException();
        }
    }
}
