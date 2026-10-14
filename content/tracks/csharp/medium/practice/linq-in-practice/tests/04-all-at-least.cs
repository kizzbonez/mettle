Workout[] week =
[
    new Workout("nia", "run", 30),
    new Workout("oli", "swim", 45),
    new Workout("nia", "yoga", 31),
];

Check.True(Club.AllAtLeast(week, 30), "every workout reaches the limit, one of them exactly");
Check.True(!Club.AllAtLeast(week, 31), "one workout one minute short");
Check.True(Club.AllAtLeast(week, 0), "every workout lasts at least 0 minutes");
Check.True(!Club.AllAtLeast(new List<Workout>(), 0), "no workouts at all is false, even for a limit of 0");
Check.True(!Club.AllAtLeast(new Workout[0], 30), "an empty array of workouts is false");
Check.True(Club.AllAtLeast([new Workout("pat", "row", 10)], 10), "a single workout that reaches the limit");
Check.True(!Club.AllAtLeast([new Workout("pat", "row", 10), new Workout("pat", "row", 9)], 10), "the last workout falls short");

// Each workout is read at most once.
int reads = 0;
IEnumerable<Workout> stream = week.Select(w => { reads++; return w; });
Check.True(Club.AllAtLeast(stream, 30), "a stream in which every workout reaches the limit");
Check.True(reads <= week.Length, "AllAtLeast reads each workout at most once");

reads = 0;
IEnumerable<Workout> shortStream = week.Select(w => { reads++; return w; });
Check.True(!Club.AllAtLeast(shortStream, 40), "a stream with workouts below the limit");
Check.True(reads <= week.Length, "AllAtLeast reads each workout at most once when one falls short");
