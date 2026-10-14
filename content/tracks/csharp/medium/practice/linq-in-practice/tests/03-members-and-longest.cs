Workout[] month =
[
    new Workout("hana", "climb", 90),
    new Workout("ivan", "run", 40),
    new Workout("hana", "swim", 30),
    new Workout("Hana", "run", 15),
    new Workout("ivan", "run", 55),
    new Workout("jo", "yoga", 55),
    new Workout("ivan", "bike", 55),
];

// MinutesByMember
var minutes = Club.MinutesByMember(month);
Check.Equal(minutes.Count, 4, "one entry per member, with names compared exactly");
Check.Equal(minutes["hana"], 120, "hana's minutes added up");
Check.Equal(minutes["Hana"], 15, "Hana with a capital is another member");
Check.Equal(minutes["ivan"], 150, "ivan's three workouts added up");
Check.Equal(minutes["jo"], 55, "a member with one workout");
Check.True(!minutes.ContainsKey("kim"), "a member never seen has no entry");
Check.Equal(Club.MinutesByMember(new List<Workout>()).Count, 0, "no workouts give an empty dictionary");

// Longest
Check.Equal(Club.Longest(month, "hana"), month[0], "hana's longest workout");
Check.Equal(Club.Longest(month, "Hana"), month[3], "the longest workout of Hana with a capital");
Check.Equal(Club.Longest(month, "ivan"), month[4], "of two equally long workouts, the first is returned");
Check.True(ReferenceEquals(Club.Longest(month, "ivan"), month[4]), "the first of the equally long workouts is the very object in the input");
Check.Equal(Club.Longest(month, "jo"), month[5], "a member with one workout");
Check.Equal(Club.Longest(month, "kim"), null, "a member with no workouts");
Check.Equal(Club.Longest(new List<Workout>(), "hana"), null, "no workouts at all");

// Other members' workouts do not count, even longer ones.
Workout[] pair = [new Workout("lea", "walk", 20), new Workout("max", "hike", 300)];
Check.Equal(Club.Longest(pair, "lea"), pair[0], "a longer workout by someone else is ignored");
