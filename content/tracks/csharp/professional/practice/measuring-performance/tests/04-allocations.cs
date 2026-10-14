// Exact counts on this 64-bit runtime: an object costs 24 bytes, and an array
// 24 bytes of header plus its elements, rounded up to a multiple of 8.
object? sink = null;
object? other = null;

Check.Equal(Measure.AllocatedBy(() => { }), 0L, "bytes allocated by work that allocates nothing");
Check.Equal(Measure.AllocatedBy(() => sink = new object()), 24L, "bytes allocated by one new object()");
Check.Equal(Measure.AllocatedBy(() => sink = new int[10]), 64L, "bytes allocated by one new int[10]");
Check.Equal(Measure.AllocatedBy(() => { sink = new byte[1000]; other = new object(); }), 1048L,
    "bytes allocated by work that allocates a byte[1000] and an object");

// The warm-up keeps a cache filled on the first call out of the count.
byte[]? cache = null;
int lazyCalls = 0;
Check.Equal(Measure.AllocatedBy(() => { lazyCalls++; cache ??= new byte[5000]; }), 0L,
    "bytes counted for work that allocates only on its first call");
Check.Equal(lazyCalls, 2, "calls of the work made by AllocatedBy");

// The second call is the one that counts: here it allocates 2,000 bytes, the first 1,000.
int growing = 0;
Check.Equal(Measure.AllocatedBy(() => { growing++; sink = new byte[growing * 1000 - 24]; }), 2000L,
    "bytes counted for work whose second call allocates twice as much as its first");

// The budget.
string? Refusal(string name, Action work, long budget)
{
    try
    {
        Measure.WithinBudget(name, work, budget);
        return null;
    }
    catch (InvalidOperationException error)
    {
        return error.Message;
    }
}

Check.Equal(Measure.WithinBudget("header", () => sink = new byte[1000], budget: 1024), 1024L,
    "work that allocates exactly its budget is within it");
Check.Equal(Refusal("header", () => sink = new byte[1000], budget: 1023), "header allocated 1024 B, budget 1023 B",
    "the message for work one byte over its budget");
Check.Equal(Refusal("parse invoice line", () => sink = new int[10], budget: 0), "parse invoice line allocated 64 B, budget 0 B",
    "the message for work that should allocate nothing");
Check.Equal(Measure.WithinBudget("quiet loop", () => { }, budget: 0), 0L, "work that allocates nothing is within a budget of 0");
Check.Equal(Refusal("cached lookup", () => cache ??= new byte[5000], budget: 0), null,
    "work that allocates only on its first call is within a budget of 0");
Check.Equal(Refusal("render", () => sink = new byte[100_000], budget: 64_000), "render allocated 100024 B, budget 64000 B",
    "the message for a large array over its budget");
