// Hostel Desk
//
// Four methods for a youth hostel's front desk. Keep every signature
// exactly as it is, including every ?: the tests call these methods by name,
// with these parameters, and some of them pass null.

static class HostelDesk
{
    // The nickname when there is one, otherwise the first name.
    public static string CallName(string first, string? nickname) => nickname ?? first;

    // The guest's bed, or null when the guest has none yet.
    public static string? BedOf(Dictionary<string, string> beds, string guest)
    {
        if (beds.TryGetValue(guest, out string? bed))
        {
            return bed;
        }
        return null;
    }

    // "Bed 3A" for the bed "3a", or "No bed yet" when there is none.
    public static string BedLabel(string? bed)
    {
        if (bed is null)
        {
            return "No bed yet";
        }
        return $"Bed {bed.Trim().ToUpper()}";
    }

    // The average of the ratings that have a value, or null when none has.
    public static double? AverageRating(int?[] ratings)
    {
        int sum = 0;
        int count = 0;
        foreach (int? rating in ratings)
        {
            if (rating.HasValue)
            {
                sum += rating.Value;
                count++;
            }
        }
        if (count == 0)
        {
            return null;
        }
        return (double)sum / count;
    }
}
