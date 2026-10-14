// Fitness Club
//
// Aggregates that must survive an empty week, a dictionary built from groups,
// the one item with the largest key, and a test of every item that reads its
// input only once.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// <summary>One workout by one member. Complete: do not change it.</summary>
public record Workout(string Member, string Activity, int Minutes);

public static class Club
{
    /// <summary>Count, total minutes and average minutes; zeros when there are no workouts.</summary>
    public static (int Sessions, int Minutes, double Average) Summary(IEnumerable<Workout> workouts)
    {
        throw new NotImplementedException();
    }

    /// <summary>Each member's minutes added up.</summary>
    public static Dictionary<string, int> MinutesByMember(IEnumerable<Workout> workouts)
    {
        throw new NotImplementedException();
    }

    /// <summary>The member's longest workout, the first of equals, or null.</summary>
    public static Workout? Longest(IEnumerable<Workout> workouts, string member)
    {
        throw new NotImplementedException();
    }

    /// <summary>Whether every workout lasted at least this long; false when there are none.</summary>
    public static bool AllAtLeast(IEnumerable<Workout> workouts, int minutes)
    {
        throw new NotImplementedException();
    }
}
