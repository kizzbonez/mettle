// A fake clock that returns the readings it was given, one after another, and
// writes every call of the clock and of the work into one log.
static (Action Work, Func<long> Clock, List<string> Log) Scripted(params long[] readings)
{
    var log = new List<string>();
    int next = 0;
    return (() => log.Add("work"), () =>
    {
        log.Add("clock");
        Check.True(next < readings.Length, "Time reads the clock twice per sample and at no other time");
        return readings[next++];
    }, log);
}

// Two warm-ups, three samples.
var (work, clock, log) = Scripted(100, 130, 130, 190, 200, 205);
Check.SequenceEqual(Measure.Time(work, warmups: 2, samples: 3, clock), [30L, 60L, 5L],
    "each sample is the second clock reading minus the first");
Check.SequenceEqual(log, ["work", "work", "clock", "work", "clock", "clock", "work", "clock", "clock", "work", "clock"],
    "the warm-ups come first without the clock, then each sample reads the clock, runs the work and reads the clock");

// No warm-up.
(work, clock, log) = Scripted(0, 7, 7, 9);
Check.SequenceEqual(Measure.Time(work, warmups: 0, samples: 2, clock), [7L, 2L], "two samples without a warm-up");
Check.SequenceEqual(log, ["clock", "work", "clock", "clock", "work", "clock"], "the calls of a run without a warm-up");

// One sample after many warm-ups.
(work, clock, log) = Scripted(1_000, 1_250);
Check.SequenceEqual(Measure.Time(work, warmups: 5, samples: 1, clock), [250L], "a single sample after five warm-ups");
Check.Equal(log.Count(entry => entry == "work"), 6, "calls of the work for five warm-ups and one sample");
Check.Equal(log.Count(entry => entry == "clock"), 2, "clock readings for one sample");
Check.True(log.Take(5).All(entry => entry == "work"), "the clock is not read during the warm-ups");

// Many samples, from a clock the work moves forward by the sample's number.
long now = 0;
int calls = 0;
long[] samples = Measure.Time(() => now += ++calls, warmups: 1, samples: 1_001, () => now);
Check.Equal(samples.Length, 1_001, "the number of samples returned");
Check.SequenceEqual(samples, Enumerable.Range(2, 1_001).Select(n => (long)n), "1,001 samples, in the order they were taken");
Check.Equal(calls, 1_002, "calls of the work for one warm-up and 1,001 samples");

// Invalid counts.
(work, clock, log) = Scripted(1, 2);
Check.Throws<ArgumentOutOfRangeException>(() => Measure.Time(work, warmups: 0, samples: 0, clock), "zero samples");
Check.Throws<ArgumentOutOfRangeException>(() => Measure.Time(work, warmups: 3, samples: -1, clock), "a negative number of samples");
Check.Throws<ArgumentOutOfRangeException>(() => Measure.Time(work, warmups: -1, samples: 2, clock), "a negative number of warm-ups");
