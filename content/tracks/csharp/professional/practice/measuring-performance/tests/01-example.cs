// The example from the instructions. The clock is fake, so every reading is
// known in advance, and the allocation counts are exact.

// Work moves the fake clock forward. The first call is slow, as a first call is.
long now = 0;
int calls = 0;
void Work()
{
    calls++;
    now += calls == 1 ? 900 : 10 + calls;
}

Check.SequenceEqual(Measure.Time(Work, warmups: 1, samples: 3, () => now), [12L, 13L, 14L],
    "samples taken with one warm-up and the fake clock");
Check.Equal(calls, 4, "calls of the work: one warm-up and three samples");
Check.Equal(Measure.Median([12, 13, 14]), 13.0, "the median of 12, 13 and 14");
Check.Equal(Measure.Median([5, 1, 4, 2]), 3.0, "the median of 5, 1, 4 and 2");

object? sink = null;
Check.Equal(Measure.AllocatedBy(() => sink = new byte[1000]), 1024L, "bytes allocated by new byte[1000]");
Check.Equal(Measure.WithinBudget("export line", () => sink = new byte[1000], budget: 2000), 1024L,
    "what WithinBudget returns for work within its budget");

string? message = null;
try
{
    Measure.WithinBudget("export line", () => sink = new byte[1000], budget: 1000);
}
catch (InvalidOperationException error)
{
    message = error.Message;
}
Check.Equal(message, "export line allocated 1024 B, budget 1000 B", "the message of WithinBudget when the work allocates more than its budget");
