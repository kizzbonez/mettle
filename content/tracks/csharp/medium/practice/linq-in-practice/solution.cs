// Fitness Club
//
// Aggregates that must survive an empty week, a dictionary built from groups,
// the one item with the largest key, and a test of every item that reads its
// input only once.

/// <summary>One workout by one member.</summary>
public record Workout(string Member, string Activity, int Minutes);

public static class Club
{
    /// <summary>Count, total minutes and average minutes; zeros when there are no workouts.</summary>
    public static (int Sessions, int Minutes, double Average) Summary(IEnumerable<Workout> workouts)
    {
        List<Workout> list = workouts.ToList();   // read once, then ask the list
        if (list.Count == 0) return (0, 0, 0);    // Average would throw on an empty list
        return (list.Count, list.Sum(w => w.Minutes), list.Average(w => w.Minutes));
    }

    /// <summary>Each member's minutes added up.</summary>
    public static Dictionary<string, int> MinutesByMember(IEnumerable<Workout> workouts) =>
        workouts
            .GroupBy(w => w.Member)
            .ToDictionary(group => group.Key, group => group.Sum(w => w.Minutes));

    /// <summary>The member's longest workout, the first of equals, or null.</summary>
    public static Workout? Longest(IEnumerable<Workout> workouts, string member) =>
        workouts.Where(w => w.Member == member).MaxBy(w => w.Minutes);   // null when none match

    /// <summary>Whether every workout lasted at least this long; false when there are none.</summary>
    public static bool AllAtLeast(IEnumerable<Workout> workouts, int minutes)
    {
        List<Workout> list = workouts.ToList();
        return list.Count > 0 && list.All(w => w.Minutes >= minutes);   // All alone is true for none
    }
}
