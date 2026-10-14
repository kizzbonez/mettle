// Road Trip
//
// A classic extension method on string, an extension property and a static
// extension member on TimeSpan, and an extension block for every sequence of
// legs.

/// <summary>One leg of the trip.</summary>
public record Leg(string From, string To, double Km, TimeSpan Time);

public static class TripExtensions
{
    /// <summary>The first three characters of the trimmed place name, in capitals.</summary>
    public static string Code(this string place)
    {
        string name = place.Trim().ToUpperInvariant();
        return name.Length <= 3 ? name : name.Substring(0, 3);
    }

    extension(TimeSpan time)
    {
        /// <summary>Whole hours and two-digit minutes, such as 2h05.</summary>
        public string Clock => $"{(int)time.TotalHours}h{time.Minutes:00}";   // TotalHours does not wrap at a day
    }

    extension(TimeSpan)   // no receiver name: static members, called on TimeSpan itself
    {
        /// <summary>The time to drive km at kmPerHour, to the nearest minute.</summary>
        public static TimeSpan Driving(double km, double kmPerHour) =>
            TimeSpan.FromMinutes(Math.Round(km / kmPerHour * 60));
    }

    extension(IEnumerable<Leg> legs)
    {
        /// <summary>The kilometres of all the legs added up.</summary>
        public double TotalKm => legs.Sum(leg => leg.Km);

        /// <summary>The place codes of the route, such as LIS > POR > MAD.</summary>
        public string Route()
        {
            List<Leg> list = legs.ToList();
            if (list.Count == 0) return "";
            var codes = new List<string> { list[0].From.Code() };
            codes.AddRange(list.Select(leg => leg.To.Code()));
            return string.Join(" > ", codes);
        }
    }
}
