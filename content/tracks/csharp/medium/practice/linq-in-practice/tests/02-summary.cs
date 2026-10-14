Check.Equal(Club.Summary(new List<Workout>()), (0, 0, 0.0), "no workouts give zeros");
Check.Equal(Club.Summary([new Workout("eve", "row", 25)]), (1, 25, 25.0), "one workout is its own average");

Workout[] days =
[
    new Workout("eve", "row", 20),
    new Workout("fred", "spin", 25),
    new Workout("eve", "row", 25),
];
var summary = Club.Summary(days);
Check.Equal(summary.Sessions, 3, "the element named Sessions counts the workouts");
Check.Equal(summary.Minutes, 70, "the element named Minutes adds the minutes");
Check.Equal(summary.Average, 70 / 3.0, "the element named Average is not rounded to a whole number");

Check.Equal(Club.Summary([new Workout("gus", "walk", 0), new Workout("gus", "walk", 0)]), (2, 0, 0.0), "workouts of 0 minutes still count as sessions");

// Each workout is read once.
int reads = 0;
IEnumerable<Workout> stream = days.Select(w => { reads++; return w; });
var streamed = Club.Summary(stream);
Check.Equal(streamed, (3, 70, 70 / 3.0), "the summary of a stream of workouts");
Check.Equal(reads, 3, "Summary reads each workout only once");

reads = 0;
IEnumerable<Workout> emptyStream = new Workout[0].Select(w => { reads++; return w; });
Check.Equal(Club.Summary(emptyStream), (0, 0, 0.0), "the summary of an empty stream");
