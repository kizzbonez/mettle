// The explicit conversion from int.
Check.Equal(((Duration)0).Seconds, 0, "the seconds of a zero duration");
Check.Equal(((Duration)59).Seconds, 59, "the seconds of a duration of 59 seconds");
Check.Equal(((Duration)3600).Seconds, 3600, "the seconds of an hour");
Check.Equal((Duration)240, (Duration)240, "two durations cast from the same number");
Check.Throws<ArgumentOutOfRangeException>(() => { Duration bad = (Duration)(-1); }, "a cast of a negative number of seconds");
Check.Throws<ArgumentOutOfRangeException>(() => { Duration bad = (Duration)int.MinValue; }, "a cast of the most negative int");

// The implicit conversion to TimeSpan.
TimeSpan ninety = (Duration)90;
Check.Equal(ninety, TimeSpan.FromSeconds(90), "a duration of 90 seconds as a TimeSpan");
TimeSpan zero = (Duration)0;
Check.Equal(zero, TimeSpan.Zero, "a zero duration as a TimeSpan");
TimeSpan hours = (Duration)7200;
Check.Equal(hours.TotalHours, 2.0, "a duration of 7200 seconds, in hours");
// Wherever a TimeSpan is expected, a Duration converts without a cast.
TimeSpan longer = TimeSpan.FromMinutes(1) + (Duration)30;
Check.Equal(longer, TimeSpan.FromSeconds(90), "a TimeSpan plus a Duration that converts on its own");

// The + operator.
Duration intro = (Duration)100;
Duration song = (Duration)25;
Duration both = intro + song;
Check.Equal(both.Seconds, 125, "the seconds of 100 seconds plus 25 seconds");
Check.True(intro.Seconds == 100 && song.Seconds == 25, "+ leaves both of its operands as they were");
Check.Equal(((Duration)45 + (Duration)15 + (Duration)60).Seconds, 120, "three durations added in a row");
Check.Equal((default(Duration) + (Duration)33).Seconds, 33, "adding to a zero duration");
Check.Equal(((Duration)50 + default(Duration)).Seconds, 50, "adding a zero duration");
