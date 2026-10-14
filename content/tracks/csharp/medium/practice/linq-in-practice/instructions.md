The record `Workout` is complete: do not change it. Write the four methods of `Club` with LINQ.
Member names are compared exactly, case included.

1. **`Summary(IEnumerable<Workout> workouts)`** returns
   `(int Sessions, int Minutes, double Average)`: the number of workouts, their minutes added up,
   and the average minutes per workout. With no workouts it returns `(0, 0, 0)` instead of
   throwing. It reads each workout **only once**, so materialize the input before you ask it
   three questions.
2. **`MinutesByMember(IEnumerable<Workout> workouts)`** returns a `Dictionary<string, int>` with
   one entry per member: that member's minutes added up. A member never seen has no entry.
3. **`Longest(IEnumerable<Workout> workouts, string member)`** returns that member's longest
   workout, or `null` if the member has none. Of several equally long ones, it returns the first.
4. **`AllAtLeast(IEnumerable<Workout> workouts, int minutes)`** is `true` when every workout lasted
   at least `minutes`. With no workouts at all it is `false`, not the vacuous `true` of `All`. It
   also reads each workout at most once.

Example:

```csharp
Workout[] week =
[
    new Workout("ana", "run", 30),
    new Workout("ben", "swim", 45),
    new Workout("ana", "yoga", 60),
    new Workout("ana", "run", 60),
];
Club.Summary(week)                   // (4, 195, 48.75)
Club.Summary([])                     // (0, 0, 0)
Club.MinutesByMember(week)["ana"]    // 150
Club.Longest(week, "ana")            // the yoga workout, the first of the two of 60 minutes
Club.Longest(week, "cy")             // null
Club.AllAtLeast(week, 30)            // true
Club.AllAtLeast([], 30)              // false
```
