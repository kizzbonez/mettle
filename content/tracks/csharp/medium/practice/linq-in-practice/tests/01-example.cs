// The example from the instructions.
Workout[] week =
[
    new Workout("ana", "run", 30),
    new Workout("ben", "swim", 45),
    new Workout("ana", "yoga", 60),
    new Workout("ana", "run", 60),
];

Check.Equal(Club.Summary(week), (4, 195, 48.75), "the summary of the week");
Check.Equal(Club.Summary([]), (0, 0, 0.0), "the summary of a week without workouts");
Check.Equal(Club.MinutesByMember(week)["ana"], 150, "ana's minutes added up");
Check.Equal(Club.Longest(week, "ana"), week[2], "ana's longest workout");
Check.Equal(Club.Longest(week, "cy"), null, "the longest workout of a member with none");
Check.True(Club.AllAtLeast(week, 30), "whether every workout of the week lasted at least 30 minutes");
Check.True(!Club.AllAtLeast([], 30), "whether every workout lasted at least 30 minutes when there are none");
