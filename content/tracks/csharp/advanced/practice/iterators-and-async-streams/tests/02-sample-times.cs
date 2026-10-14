// The schedule, from any start.
Check.SequenceEqual(Station.SampleTimes(0, 10).Take(5), [0, 10, 20, 30, 40], "the first five sample times from minute 0, every 10 minutes");
Check.SequenceEqual(Station.SampleTimes(7, 1).Take(3), [7, 8, 9], "a reading every minute");
Check.Equal(Station.SampleTimes(360, 15).First(), 360, "the first sample time is firstMinute itself");

// It never ends: take as many as you like.
Check.Equal(Station.SampleTimes(0, 5).Take(5000).Last(), 24995, "the 5000th sample time, every 5 minutes from 0");
Check.Equal(Station.SampleTimes(100, 3).ElementAt(1000), 3100, "the sample time at position 1000");

// The same sequence can be enumerated again, and starts again from the beginning.
IEnumerable<int> schedule = Station.SampleTimes(60, 30);
Check.SequenceEqual(schedule.Take(3), [60, 90, 120], "the first enumeration of a schedule");
Check.SequenceEqual(schedule.Take(2), [60, 90], "a second enumeration of the same schedule starts again");

// A bad step is reported at the call, before anyone enumerates.
Check.Throws<ArgumentOutOfRangeException>(() => Station.SampleTimes(0, 0), "SampleTimes with every 0 minutes, at the call");
Check.Throws<ArgumentOutOfRangeException>(() => Station.SampleTimes(30, -15), "SampleTimes with a negative step, at the call");
Check.Throws<ArgumentOutOfRangeException>(() => Station.SampleTimes(30, int.MinValue), "SampleTimes with the most negative step, at the call");
