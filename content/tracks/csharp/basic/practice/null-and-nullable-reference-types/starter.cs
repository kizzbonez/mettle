// Hostel Desk
//
// Four methods for a youth hostel's front desk. Keep every signature
// exactly as it is, including every ?: the tests call these methods by name,
// with these parameters, and some of them pass null.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

static class HostelDesk
{
    // The nickname when there is one, otherwise the first name.
    public static string CallName(string first, string? nickname)
    {
        throw new NotImplementedException();
    }

    // The guest's bed, or null when the guest has none yet.
    public static string? BedOf(Dictionary<string, string> beds, string guest)
    {
        throw new NotImplementedException();
    }

    // "Bed 3A" for the bed "3a", or "No bed yet" when there is none.
    public static string BedLabel(string? bed)
    {
        throw new NotImplementedException();
    }

    // The average of the ratings that have a value, or null when none has.
    public static double? AverageRating(int?[] ratings)
    {
        throw new NotImplementedException();
    }
}
